const GIFEncoder = require('gif-encoder-2')
const { createCanvas, Image } = require('canvas')
const { createWriteStream, readdir } = require('fs')
const { promisify } = require('util')
const path = require('path') 
const readdirAsync = promisify(readdir)
const imagesFolder = path.join(__dirname, 'input')
 
async function createGif() {
  var algorithm = 'neuquant'
  return new Promise(async resolve1 => {
    // read image directory
    const files = await readdirAsync(imagesFolder)

    // sort files by name
    files.sort((a, b) => a.localeCompare(b));

    console.log("before width grab");
 
    // find the width and height of the image
    const [width, height] = await new Promise(resolve2 => {
      const image = new Image()
      image.onload = () => resolve2([image.width, image.height])
      image.src = path.join(imagesFolder, files[0])
    })

    console.log("after width grab");
 
    // base GIF filepath on which algorithm is being used
    const dstPath = path.join(__dirname, 'output', `intermediate-${algorithm}.gif`)
    // create a write stream for GIF data
    const writeStream = createWriteStream(dstPath)
    // when stream closes GIF is created so resolve promise
    writeStream.on('close', () => {
      resolve1()
    })
 
    console.log(`Creating GIF: ${dstPath}`);
    const encoder = new GIFEncoder(width, height, algorithm, true, 10)
    // pipe encoder's read stream to our write stream
    encoder.createReadStream().pipe(writeStream)
    encoder.start()
    encoder.setDelay(200)
 
    console.log(`Encoding frames...`);
    const canvas = createCanvas(width, height)
    const ctx = canvas.getContext('2d')
 
    encoder.on('progress', percent => {
        console.log(`Encoding: ${percent}%`);   
    });

    console.log("before loop");
    // draw an image for each file and add frame to encoder
    for (const file of files) {
      await new Promise(resolve3 => {
        const image = new Image()
        image.onload = () => {
          ctx.drawImage(image, 0, 0)
          encoder.addFrame(ctx)
          resolve3()
        }
        console.log("before image.src");
        image.src = path.join(imagesFolder, file)
      })
    }
  })
}

//createGif();
export default createGif;
