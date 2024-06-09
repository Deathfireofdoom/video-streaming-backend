import path from "path"
import fs from 'fs';
import { loadFileFromS3, uploadFileToS3 } from "./s3Service"
import ffmpeg from 'fluent-ffmpeg';

ffmpeg.setFfmpegPath('/usr/bin/ffmpeg');

export const encodeVideo = async(s3Key: string): Promise<string> => { 
    // this function is responsible for performing the enconding, since this 
    // function is a bit more complex, I will add more comments to it.
    

    // the file was "checkpointed" in s3 after uploaded, basically uploaded and saved
    // so we can use it later. Here we load it from s3.
    const fileBuffer = await loadFileFromS3(s3Key);

    // ffmpeg needs the file to be stored locally (at least I think so), so we save it
    // to disk.
    const inputFile = path.join(__dirname, `${Date.now()}-${s3Key.split('/').pop()}`);
    await fs.promises.writeFile(inputFile, fileBuffer);

    // this is where the encoding magic happens
    const encodedFiles = await encodeAndChunkVideo(inputFile);

    // here we check which files was created by the encoding-process and gets
    // all filenames, so we know what to upload to s3.
    const generatedFilesToUpload = await getAllGeneratedFiles(inputFile);

    // this uploads all the files that was generated to s3.
    const uploadPromises = generatedFilesToUpload.map((encodedFile: string) => 
        uploadFileToS3(fs.createReadStream(encodedFile), path.basename(encodedFile))
    );
    await Promise.all(uploadPromises);

    // the way this encoding/chunking works is that it creates a "master-playlist" which contains
    // info about the different chunks and encodings that were created. This file is generated 
    // so the client can get the info on how to fetch the correct chunk later on. Also written
    // to s3.
    const masterPlaylistContent = generateMasterPlaylistContent(encodedFiles);
    const masterPlaylistPath = path.join(__dirname, `${path.basename(inputFile, path.extname(inputFile))}-master.m3u8`);
    await fs.promises.writeFile(masterPlaylistPath, masterPlaylistContent);

    const masterPlaylistUploadResponse = await uploadFileToS3(fs.createReadStream(masterPlaylistPath), path.basename(masterPlaylistPath));

    // here we would have a step cleaning upp all the temp files, maybe I have time to add it.
    // but basically the storage will get full otherwise, the files on disk is no longer
    // needed since they are served and saved from s3.

    console.log('Encoding and uploading completed.');
    return masterPlaylistUploadResponse.s3Url;
}

interface Resolution {
  name: string;
  size: string;
}

export const encodeAndChunkVideo = (inputFile: string): Promise<string[]> => {
    // encodeAndChunkVideo uses ffmpeg to generate the chunks and encodings.
    // This is a pretty advanced process and I did not think it was worth to
    // re-invent the wheel.
    return new Promise((resolve, reject) => {
        const resolutions: Resolution[] = [
            { name: '360p', size: '640x360' },
            { name: '480p', size: '854x480' },
            { name: '720p', size: '1280x720' },
            { name: '1080p', size: '1920x1080' }
        ];

        const outputFiles: string[] = [];
        const originalFilename = path.basename(inputFile, path.extname(inputFile));
        let command = ffmpeg(inputFile);

        // Below is where the FFMPEG magic happens. I am not a encoding guru, so the options below
        // may not be the best and some are more thought through than others.
        // we do this on the video once for each resolution.
        resolutions.forEach((res) => {
            const outputFilePath = path.join(__dirname, `${originalFilename}-${res.name}.m3u8`);
            outputFiles.push(outputFilePath);
            command = command
                .output(outputFilePath)
                // libx264 is what is normally called H.264 and seems to be pretty standard for video
                // streaming.
                .videoCodec('libx264')
                // A very standard encoding for audio
                .audioCodec('aac')
                .size(res.size)
                .outputOptions([
                    // speed over quality, probably not wanted in production but my computer
                    // is not a monster.
                    '-preset fast',
                    '-g 48',
                    '-keyint_min 48',
                    // I am not 100% sure about this, but from my limited understanding of video encodings
                    // this would control if we do intraframe or interframe compression. 
                    '-sc_threshold 0',
                    '-b:v 1400k', // quality/size related
                    '-maxrate 1500k', // quality/size related
                    '-bufsize 2100k', // smoothness 
                    `-vf scale=${res.size.split('x')[0]}:-2`,
                    // this controlls chunk size, why 10s? why not.
                    '-hls_time 10',
                    // this make the playlist static, I believe this suits pre-recorded video well.
                    // if we did live streaming we would use "event" (?)
                    '-hls_playlist_type vod',
                    '-hls_segment_filename', path.join(__dirname, `${originalFilename}-${res.name}%d.ts`),
                    // this sets the format to HLS, HTTP live streaming, I would not die on this hill, maybe dash or rtmp would be better. 
                    '-f hls'
                ]);
        });

        command
            .on('start', (commandLine) => {
                console.log('Spawned Ffmpeg with command: ' + commandLine);
            })
            .on('progress', (progress) => {
                console.log('Processing: ' + progress.percent + '% done');
            })
            //.on('stderr', (stderrLine) => {
            //    console.error('Stderr output: ' + stderrLine);
            //})
            .on('end', () => {
                console.log('All resolutions processed and chunked');
                resolve(outputFiles);
            })
            .on('error', (err) => {
                console.error('Error processing video:', err.message);
                reject(err);
            })
            .run();
    });
};

export const generateMasterPlaylistContent = (outputFiles: string[]): string => {
    // Maybe there is a better way to generate this file masterplaylist file. 
    // The master-playlist file is used by the client to locate the different resolutions-playlist
    // and based on the network speed change resolution. 
    
    // Here is an example output
    //  #EXTM3U
    //  #EXT-X-STREAM-INF:BANDWIDTH=800000,RESOLUTION=720x480 - what bandwith for which resolution
    //  video-720x480.m3u8 - what playlist file the user should look at
    //  #EXT-X-STREAM-INF:BANDWIDTH=2000000,RESOLUTION=1280x720
    //  video-1280x720.m3u8
    //  #EXT-X-STREAM-INF:BANDWIDTH=5000000,RESOLUTION=1920x1080
    //  video-1920x1080.m3u8
    
    let content = '#EXTM3U\n';
    outputFiles.forEach((file) => {
        const parts = path.basename(file).split('-');
        const resolutionPart = parts.pop();
        const resolution = resolutionPart ? resolutionPart.replace('.m3u8', '') : null;
        if (resolution) {
        let bandwidth;
        switch (resolution) {
            case '640x360':
                bandwidth = 500000; // 500 kbps
                break;
            case '854x480':
                bandwidth = 1500000; // 1500 kbps
                break;
            case '1280x720':
                bandwidth = 3500000; // 3500 kbps
                break;
            case '1920x1080':
                bandwidth = 6000000; // 6000 kbps
                break;
            default:
                bandwidth = 1000000; // unknown resolution, not sure what to do, lets just go brrr
        }
        content += `#EXT-X-STREAM-INF:BANDWIDTH=${bandwidth},RESOLUTION=${resolution}\n`;
        content += `${path.basename(file)}\n`;
        } else {
        console.error('Error while creating master playlist: resolution part is undefined');
        }
    });
    return content;
};

export const getAllGeneratedFiles = async (inputFile: string): Promise<string[]> => {
    const directory = path.dirname(inputFile);
    const files = await fs.promises.readdir(directory);
    const originalFilename = path.basename(inputFile, path.extname(inputFile));

    return files
        .filter(file => file.startsWith(originalFilename))
        .map(file => path.join(directory, file));
};