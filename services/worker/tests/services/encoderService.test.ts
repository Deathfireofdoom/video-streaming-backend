import fs from 'fs';
import { encodeVideo, generateMasterPlaylistContent } from '../../src/services/encoderService';
import { loadFileFromS3, uploadFileToS3 } from '../../src/services/s3Service';

jest.mock('fs', () => ({
  promises: {
    writeFile: jest.fn(),
    readdir: jest.fn().mockResolvedValue([
      'example-360p.m3u8', 'example-480p.m3u8', 'example-720p.m3u8', 'example-1080p.m3u8',
      'example-360p0.ts', 'example-480p0.ts', 'example-720p0.ts', 'example-1080p0.ts'
    ]),
  },
  createReadStream: jest.fn()
}));

jest.mock('../../src/services/s3Service', () => ({
  loadFileFromS3: jest.fn(),
  uploadFileToS3: jest.fn().mockResolvedValue({ s3Url: 'http://example.com/master.m3u8' })
}));

jest.mock('fluent-ffmpeg', () => {
  const ffmpeg = () => ({
    output: jest.fn().mockReturnThis(),
    videoCodec: jest.fn().mockReturnThis(),
    audioCodec: jest.fn().mockReturnThis(),
    size: jest.fn().mockReturnThis(),
    outputOptions: jest.fn().mockReturnThis(),
    on: jest.fn().mockReturnThis(),
    run: jest.fn().mockImplementation(function (this: any) {
      const callback = this.on.mock.calls.find((call: any[]) => call[0] === 'end')?.[1];
      if (callback) callback();
    })
  });

  ffmpeg.setFfmpegPath = jest.fn();
  return ffmpeg;
});

describe('encodeVideo', () => {
  it('should encode video and upload files to S3', async () => {
    (loadFileFromS3 as jest.Mock).mockResolvedValue(Buffer.from('dummy video data'));

    const result = await encodeVideo('path/to/video.mp4');

    expect(loadFileFromS3).toHaveBeenCalledWith('path/to/video.mp4');
    expect(fs.promises.writeFile).toHaveBeenCalled();
    expect(uploadFileToS3).toHaveBeenCalled();
    expect(result).toBe('http://example.com/master.m3u8');
  });
});


describe('generateMasterPlaylistContent', () => {
  it('should generate master playlist for known resolutions', () => {
    const outputFiles = [
      'video-640x360.m3u8',
      'video-854x480.m3u8',
      'video-1280x720.m3u8',
      'video-1920x1080.m3u8'
    ];
    const result = generateMasterPlaylistContent(outputFiles);

    expect(result).toBe(
      `#EXTM3U
#EXT-X-STREAM-INF:BANDWIDTH=500000,RESOLUTION=640x360
video-640x360.m3u8
#EXT-X-STREAM-INF:BANDWIDTH=1500000,RESOLUTION=854x480
video-854x480.m3u8
#EXT-X-STREAM-INF:BANDWIDTH=3500000,RESOLUTION=1280x720
video-1280x720.m3u8
#EXT-X-STREAM-INF:BANDWIDTH=6000000,RESOLUTION=1920x1080
video-1920x1080.m3u8
`
    );
  });

  it('should handle unknown resolution gracefully', () => {
    const outputFiles = [
      'video-640x360.m3u8',
      'video-unknown.m3u8'
    ];
    const result = generateMasterPlaylistContent(outputFiles);

    expect(result).toBe(
      `#EXTM3U
#EXT-X-STREAM-INF:BANDWIDTH=500000,RESOLUTION=640x360
video-640x360.m3u8
#EXT-X-STREAM-INF:BANDWIDTH=1000000,RESOLUTION=unknown
video-unknown.m3u8
`
    );
  });
});
