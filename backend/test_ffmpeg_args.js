const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');
ffmpeg.setFfmpegPath(ffmpegPath);

const command = ffmpeg('dummy.mp4')
  .size('?x480')
  .videoCodec('libx264')
  .outputOptions([
      '-crf', '30',
      '-preset', 'ultrafast',
      '-movflags', '+faststart'
  ])
  .noAudio()
  .toFormat('mp4');

console.log(command._getArguments().join(' '));
