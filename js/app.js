// import 1280 853

/////////////////// Start/////////////////////////////////////////
class Fill {
  constructor(canvas, point, color) {
    this.context = canvas.getContext("2d");
    // console.log(point);
    // console.log(color);
    this.imageData = this.context.getImageData(
      0,
      0,
      this.context.canvas.width,
      this.context.canvas.height
    );

    const targetColor = this.getPixel(point);

    const fillColor = this.hexToRgba(color);

    this.fillStack = [];

    this.floodFill(point, targetColor, fillColor);
    this.fillColor();
  }

  floodFill(point, targetColor, fillColor) {
    if (this.colorMatch(targetColor, fillColor)) return;

    const currentColor = this.getPixel(point);

    if (this.colorMatch(currentColor, targetColor)) {
      this.setPixel(point, fillColor);

      this.fillStack.push([
        new Point(point.x + 1, point.y),
        targetColor,
        fillColor
      ]);
      this.fillStack.push([
        new Point(point.x - 1, point.y),
        targetColor,
        fillColor
      ]);
      this.fillStack.push([
        new Point(point.x, point.y + 1),
        targetColor,
        fillColor
      ]);
      this.fillStack.push([
        new Point(point.x, point.y - 1),
        targetColor,
        fillColor
      ]);
    }
  }
  fillColor() {
    if (this.fillStack.length) {
      let range = this.fillStack.length;

      for (let i = 0; i < range; i++) {
        this.floodFill(
          this.fillStack[i][0],
          this.fillStack[i][1],
          this.fillStack[i][2]
        );
      }

      this.fillStack.splice(0, range);

      this.fillColor();
    } else {
      this.context.putImageData(this.imageData, 0, 0);
      this.fillStack = [];
    }
  }
  getPixel(point) {
    if (
      (point.x < 0 || point.y < 0 || point.x >= this.imageData.width,
      point.y >= this.imageData.height)
    ) {
      return [-1, -1, -1, -1]; //impossible color
    } else {
      const offset = (point.y * this.imageData.width + point.x) * 4;
      return [
        this.imageData.data[offset + 0],
        this.imageData.data[offset + 1],
        this.imageData.data[offset + 2],
        this.imageData.data[offset + 3]
      ];
    }
  }
  setPixel(point, fillColor) {
    const offset = (point.y * this.imageData.width + point.x) * 4;
    this.imageData.data[offset + 0] = fillColor[0]; //red
    this.imageData.data[offset + 1] = fillColor[1]; //green
    this.imageData.data[offset + 2] = fillColor[2]; //blue
    this.imageData.data[offset + 3] = fillColor[3]; //alpha
  }

  colorMatch(color1, color2) {
    return (
      color1[0] == color2[0] &&
      color1[1] == color2[1] &&
      color1[2] == color2[2] &&
      color1[3] == color2[3]
    );
  }

  hexToRgba(hex) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return [
      parseInt(result[1], 16),
      parseInt(result[2], 16),
      parseInt(result[3], 16),
      255
    ];
  }
}

/////////////////////////////////////////////////////////////////
class Tool {
  static TOOL_LINE = "line";
  static TOOL_RECTANGLE = "rectangle";
  static TOOL_CIRCLE = "circle";
  static TOOL_TRIANGLE = "triangle";
  static TOOL_PAINT_BUCKET = "paint-bucket";
  static TOOL_PENCIL = "pencil";
  static TOOL_BRUSH = "brush";
  static TOOL_ERASER = "eraser";
}

function findDistance(coords1, coords2) {
  let exp1 = Math.pow(coords2.x - coords1.x, 2);
  let exp2 = Math.pow(coords2.y - coords1.y, 2);

  let distance = Math.sqrt(exp1 + exp2);
  return distance;
}
//////////////Paint.class.js////////////

class Paint {
  constructor(canvas) {
    this.canvas = document.querySelector("#canvas");
    this.context = canvas.getContext("2d");

    this.undoStack = [];
    this.undoLimit = 5;
  }
  set activeTool(tool) {
    this.tool = tool;
  }
  set lineWidth(linewidth) {
    this._lineWidth = linewidth;
    this.context.lineWidth = this._lineWidth;
  }
  set brushSize(brushsize) {
    this._brushSize = brushsize;
    this.context.brushSize = this._brushSize;
  }
  set selectedColor(color) {
    this.color = color;
    this.context.strokeStyle = this.color;
  }
  init() {
    this.canvas.onmousedown = e => this.onMouseDown(e);
  }
  onMouseDown(e) {
    this.savedData = this.context.getImageData(
      0,
      0,
      this.canvas.clientWidth,
      this.canvas.clientHeight
    );

    if (this.undoStack.length >= this.undoLimit) this.undoStack.shift();
    this.undoStack.push(this.savedData);

    this.canvas.onmousemove = e => this.onMouseMove(e);
    document.onmouseup = e => this.onMouseUp(e);

    this.startPos = getMouseCoordsOnCanvas(e, this.canvas);

    if (this.tool == Tool.TOOL_PENCIL || this.tool == Tool.TOOL_BRUSH) {
      this.context.beginPath();
      this.context.moveTo(this.startPos.x, this.startPos.y);
    } else if (this.tool == Tool.TOOL_PAINT_BUCKET) {
      new Fill(this.canvas, this.startPos, this.color);
    } else if (this.tool == Tool.TOOL_ERASER) {
      this.context.clearRect(
        this.startPos.x,
        this.startPos.y,
        this._brushSize,
        this._brushSize
      );
    }
  }

  onMouseMove(e) {
    this.currentPos = getMouseCoordsOnCanvas(e, this.canvas);

    switch (this.tool) {
      case Tool.TOOL_LINE:
      case Tool.TOOL_RECTANGLE:
      case Tool.TOOL_CIRCLE:
      case Tool.TOOL_TRIANGLE:
        this.drawShape();
        break;
      case Tool.TOOL_PENCIL:
        this.drawFreeline(this._lineWidth);
        break;
      case Tool.TOOL_BRUSH:
        this.drawFreeline(this._brushSize);
        break;
      case Tool.TOOL_ERASER:
        this.context.clearRect(
          this.currentPos.x,
          this.currentPos.y,
          this._brushSize,
          this._brushSize
        );
      default:
        break;
    }
  }

  onMouseUp(e) {
    this.canvas.onmousemove = null;
    document.onmouseup = null;
  }

  drawShape() {
    this.context.putImageData(this.savedData, 0, 0);
    this.context.beginPath();
    if (this.tool == Tool.TOOL_LINE) {
      this.context.moveTo(this.startPos.x, this.startPos.y);
      this.context.lineTo(this.currentPos.x, this.currentPos.y);
    } else if (this.tool == Tool.TOOL_RECTANGLE) {
      this.context.rect(
        this.startPos.x,
        this.startPos.y,
        this.currentPos.x - this.startPos.x,
        this.currentPos.y - this.startPos.y
      );
    } else if (this.tool == Tool.TOOL_CIRCLE) {
      let distance = findDistance(this.startPos, this.currentPos);
      this.context.arc(
        this.startPos.x,
        this.startPos.y,
        distance,
        0,
        2 * Math.PI,
        false
      );
    } else if (this.tool == Tool.TOOL_TRIANGLE) {
      this.context.moveTo(
        this.startPos.x + (this.currentPos.x - this.startPos.x) / 2,
        this.startPos.y
      );
      this.context.lineTo(this.startPos.x, this.currentPos.y);
      this.context.lineTo(this.currentPos.y, this.currentPos.y);
      this.context.closePath();
    }
    this.context.stroke();
  }

  drawFreeline(lineWidth) {
    this.context.lineWidth = lineWidth;
    this.context.lineTo(this.currentPos.x, this.currentPos.y);
    this.context.stroke();
  }
  undoPaint() {
    if (this.undoStack.length > 0) {
      this.context.putImageData(
        this.undoStack[this.undoStack.length - 1],
        0,
        0
      ); //get last element of undo stack
      this.undoStack.pop();
    } else {
      alert("No Undo Available, Press (Ctrl + R) to Reset");
    }
  }
}

document.onkeydown = KeyPress;
///////////////utility.js/////////////
function getMouseCoordsOnCanvas(e, canvas) {
  let rect = canvas.getBoundingClientRect();
  let x = Math.round(e.clientX - rect.left);
  let y = Math.round(e.clientY - rect.top);
  return new Point(x, y);
}

////////////Point.js//////////
class Point {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }
}
/////////// Save///////////////
function save() {
  var canvas = document.querySelector("#canvas");
  var image = canvas
    .toDataURL("image/png", 1.0)
    .replace("image/png", "image/octet-stream");
  var link = document.createElement("a");
  link.download = "paint.png";
  link.href = image;
  link.click();
  return link;
}

///////////////////////////////////////////////////////////////////////
var paint = new Paint(canvas);
paint.activeTool = Tool.TOOL_LINE;
paint.brushSize = 4;
paint.selectedColor = "#000000";
paint.lineWidth = 3;
// paint.selectedColor = "#000";
paint.init();

document.querySelectorAll("[data-command]").forEach(item => {
  item.addEventListener("click", e => {
    let command = item.getAttribute("data-command");
    if (command == "undo") {
      paint.undoPaint();
    } else if (command == "download") {
      save();
    }
  });
});
document.querySelectorAll("[data-tool]").forEach(item => {
  item.addEventListener("click", e => {
    document.querySelector("[data-tool].active").classList.toggle("active");
    item.classList.toggle("active");

    /////////////////////////Activate/Deactivate Line Tool////////////////////////////////
    let selectedTool = item.getAttribute("data-tool");
    paint.activeTool = selectedTool;
    switch (selectedTool) {
      case Tool.TOOL_LINE:
      case Tool.TOOL_RECTANGLE:
      case Tool.TOOL_CIRCLE:
      case Tool.TOOL_PENCIL:
      case Tool.TOOL_TRIANGLE:
        document.querySelector(".group.for-shapes").style.display = "block";
        //activate shapes line widths
        document.querySelector(".group.for-brush").style.display = "none";
        //invisible brush linewidth
        break;
      case Tool.TOOL_BRUSH:
      case Tool.TOOL_ERASER:
        document.querySelector(".group.for-shapes").style.display = "none";
        document.querySelector(".group.for-brush").style.display = "block";
        break;
      //invisible shapes line widths
      //activate brush linewidth
      default:
        document.querySelector(".group.for-shapes").style.display = "none";
        document.querySelector(".group.for-brush").style.display = "none";
      //make invisible both linewidth groups
    }
  });
});

document.querySelectorAll("[data-line-width]").forEach(item => {
  item.addEventListener("click", e => {
    document
      .querySelector("[data-line-width].active")
      .classList.toggle("active");
    item.classList.toggle("active");

    let linewidth = item.getAttribute("data-line-width");
    paint.lineWidth = linewidth;
  });
});

document.querySelectorAll("[data-brush-size]").forEach(item => {
  item.addEventListener("click", e => {
    document
      .querySelector("[data-brush-size].active")
      .classList.toggle("active");
    item.classList.toggle("active");

    let brushsize = item.getAttribute("data-brush-size");
    paint.brushSize = brushsize;
  });
});

document.querySelectorAll("[data-color]").forEach(item => {
  item.addEventListener("click", e => {
    document.querySelector("[data-color].active").classList.toggle("active");
    item.classList.toggle("active");

    let color = item.getAttribute("data-color");
    paint.selectedColor = color;
  });
});
///////////////////////// Key Combinations //////////////////////////////////////////
function KeyPress(e) {
  var evtobj = window.event ? event : e;

  //test1 if (evtobj.ctrlKey) alert("Ctrl");
  //test2 if (evtobj.keyCode == 122) alert("z");
  //test 1 & 2
  if (evtobj.keyCode == 90 && evtobj.ctrlKey) {
    paint.undoPaint();
  }
  if (evtobj.keyCode == 83 && evtobj.ctrlKey && evtobj.shiftKey) {
    save();
  }

  if (evtobj.keyCode == 83) {
    paint.activeTool(Tool.TOOL_LINE);
  }
}
