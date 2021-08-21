import "./App.css";
import React from "react";
import Dropzone from "react-dropzone";
import gifshot from "gifshot";
import { Button, CircularProgress } from "@material-ui/core";
import {
  createTheme,
  withStyles,
  makeStyles,
  ThemeProvider,
} from "@material-ui/core/styles";
import { green, red } from "@material-ui/core/colors";
import GIFEncoder from "gif-encoder-2";
import { createCanvas } from "canvas";
import path from "path";

const thumb = {
  display: "inline-flex",
  borderRadius: 2,
  border: "1px solid #eaeaea",
  marginBottom: 8,
  marginRight: 8,
  width: 100,
  height: 100,
  padding: 4,
  boxSizing: "border-box",
};

const thumbInner = {
  display: "flex",
  minWidth: 0,
  overflow: "hidden",
};

const img = {
  display: "block",
  width: "auto",
  height: "100%",
};

const ColorButton = withStyles((theme) => ({
  root: {
    color: theme.palette.getContrastText(red[500]),
    backgroundColor: red[500],
    "&:hover": {
      backgroundColor: red[700],
    },
  },
}))(Button);

const useStyles = makeStyles((theme) => ({
  margin: {
    margin: theme.spacing(1),
  },
}));

const theme = createTheme({
  palette: {
    primary: green,
  },
});

class App extends React.Component {
  constructor() {
    super();
    this.onDrop = (files) => {
      files.map((file) => {
        Object.assign(file, { preview: URL.createObjectURL(file) });
      });

      //create gif with file names
      gifshot.createGIF(
        {
          images: files.map((file) => {
            return file.preview;
          }),
          numWorkers: 10,
        },
        (obj) => {
          var image = obj.image;
          this.setState({ gif: image });
          files.sort((a, b) => a.name.localeCompare(b.name));
        }
      );

      this.setState({ files: files });
      // sort files by name
    };

    this.createGif = () => {
      var algorithm = "neuquant";
      return new Promise(async (resolve1) => {
        // find the width and height of the image
        const [width, height] = await new Promise((resolve2) => {
          try {
            const image = new Image();
            image.onload = () => resolve2([image.width, image.height]);
            image.src = this.state.files[0].preview;
          } catch (error) {
            console.error(error);
          }

        });

        // base GIF filepath on which algorithm is being used
        const dstPath = path.join(
          __dirname,
          "output",
          `intermediate-${algorithm}.gif`
        );
        // create a write stream for GIF data
        //const writeStream = createWriteStream(dstPath);
        // when stream closes GIF is created so resolve promise
        // writeStream.on("close", () => {
        //   resolve1();
        // });

        const encoder = new GIFEncoder(
          width,
          height,
          algorithm,
          true,
          this.state.files.length
        );
        // pipe encoder's read stream to our write stream

        var readStream = encoder.createReadStream();
        encoder.start();
        encoder.setDelay(200);

        var entireBuffer;
        readStream.on('data', buffer => {
          if(!entireBuffer) {
            entireBuffer = buffer;
          } else {
            entireBuffer = Buffer.concat([entireBuffer, buffer]);
          }
        });
        readStream.on('end', () => {
          const blob = new Blob([entireBuffer], { type: 'image/gif' });
          const url = URL.createObjectURL(blob);
          this.setState({ gifToDownload: url });
          window.open(url);
          resolve1();
        });

        readStream.on('error', error => {
          console.error(error);
        });

        readStream.on('close', () => {
          console.log('closed');
        });

        const canvas = createCanvas(width, height);
        const ctx = canvas.getContext("2d");

        encoder.on("progress", async (percent) => {
          this.setState({ progressEncoded: percent });
        });

        // draw an image for each file and add frame to encoder
        for (const file of this.state.files) {
          await new Promise((resolve3) => {
            const image = new Image();
            image.onload = () => {
              ctx.drawImage(image, 0, 0);
              encoder.addFrame(ctx);
              resolve3();
            };
            image.src = file.preview;
          });
        }
        encoder.finish();
      });
    };

    this.state = {
      files: [],
      gif: "test",
      progressEncoded: 0,
      gifToDownload: "test"
    };
  }

  render() {
    const testFiles = this.state.files.map((file) => (
      <div style={thumb} key={file.name}>
        <div style={thumbInner}>
          <img src={file.preview} alt="" style={img} />
        </div>
      </div>
    ));

    const gif = this.state.gif;

    return (
      <div className="App">
        <Dropzone onDrop={this.onDrop}>
          {({ getRootProps, getInputProps }) => (
            <section className="container">
              <div {...getRootProps({ className: "dropzone" })}>
                <input {...getInputProps()} />
                <p>Drag 'n' drop some files here, or click to select files</p>
              </div>
              <aside>
                <h4>Files</h4>
                <ol>{testFiles}</ol>
              </aside>
            </section>
          )}
        </Dropzone>
        <img src={gif} alt="" />
        {gif !== "test" && (
          <ColorButton color="primary" onClick={this.createGif}>
            Download
          </ColorButton>
        )}
        <CircularProgress variant="determinate" value={this.state.progressEncoded} />
      </div>
    );
  }
}

export default App;
