class Node {

  constructor(value) {
    this.value = value;
    this.left = null;
    this.right = null;
  }

  addChild(node) {
    if (node.value < this.value) {
      if (this.left == null) {
        this.left = node;
      } else {
        this.left.addChild(node);
      }
    } else if (node.value > this.value) {
      if (this.right == null) {
        this.right = node;
      } else {
        this.right.addChild(node);
      }
    }
  }

  removeValue(value, parentNode) {
    if (value < this.value && this.left != null) {
      this.left.removeValue(value, this);
    } else if (value > this.value && this.right != null) {
      this.right.removeValue(value, this);
    } else if (this.value == value) {
      if (this.left != null && this.right != null) {
        this.value = this.right.findMin();
        this.right.removeValue(this.value, this);
      } else if (parentNode != null && parentNode.left == this) {
        parentNode.left = this.left != null ? this.left : this.right;
      } else if (parentNode != null && parentNode.right == this) {
        parentNode.right = this.left != null ? this.left : this.right;
      }
    }
  }

  findMin() {
    let curr = this;
    while (curr.left) {
      curr = curr.left;
    }
    return curr.value;
  }

  findMax() {
    let curr = this;
    while (curr.right) {
      curr = curr.right;
    }
    return curr.value;
  }
}

class BinarySearchTree {

  constructor(values) {
    this.root = null;
    if (values) {
      for (let value of values) {
        this.addValue(value);
      }
    }
  }

  addValue(value) {
    const node = new Node(value)
    if (this.root == null) {
      this.root = node;
    } else {
      this.root.addChild(node);
    }
  }

  removeValue(value) {
    if (this.root.value == value) {
      const temp = new Node(0);
      temp.left = this.root;
      this.root.removeValue(value, temp);
      this.root = temp.left;
    } else {
      this.root.removeValue(value, null);
    }
  }

  findNode(value) {
    let node = this.root;
    while (node.value != value) {
      if (node.value > value) {
        node = node.left;
      } else if (node.value < value) {
        node = node.right;
      }
    }
    return node;
  }

  maxDepth() {
    const maxDepth = (node) => {
      if (node == null) {
        return 0;
      }
      return Math.max(maxDepth(node.left), maxDepth(node.right)) + 1;
    }
    return maxDepth(this.root);
  }

  depthFirstTraversal(action) {
    const depthFirstTraversal = (node) => {
      if (node == null) {
        return;
      }
      depthFirstTraversal(node.left);
      action.call(this, node);
      depthFirstTraversal(node.right);
    };
    depthFirstTraversal(this.root);
  }
}

class Animation {
  constructor(frameDuration) {
    this.frameDuration = frameDuration;
    this.frames = [];
  }

  animate(action, repeatWhile) {
    this.frames.push({
      action: action,
      repeatWhile: repeatWhile
    });
    return this;
  }

  pause(frames) {
    let i = 0;
    this.frames.push({
      action: () => {},
      repeatWhile: () => i++ < frames
    });
    return this;
  }

  play() {
    const animation = this;
    let index = 0;
    const animate = () => {
      const frame = animation.frames[index];
      setTimeout(() => {
        frame.action();
        if (frame.repeatWhile && frame.repeatWhile() || ++index < animation.frames.length) {
          animate();
        }
      }, animation.frameDuration);
    };
    animate();
  }
}

class TreeRenderer {

  constructor(tree, animation, config) {
    this.tree = tree;
    this.frameDuration = animation.frameDuration;

    this.r = config.radius;
    this.d = 2 * config.radius;
    this.mh = config.margins.horizontal;
    this.mv = config.margins.vertical;

    this.fontSize = config.fontSize;

    this.defaultColor = {r: 255, g: 255, b: 255};
    this.highlightColors = [
      {r: 250, g: 114, b: 104},
      {r: 95, g: 75, b: 139},
      {r: 136, g: 176, b: 75},
      {r: 247, g: 202, b: 201},
      {r: 145, g: 168, b: 208},
      {r: 150, g: 79, b: 76},
      {r: 173, g: 94, b: 153},
      {r: 0, g: 152, b: 116},
      {r: 221, g: 65, b: 36},
      {r: 214, g: 80, b: 118},
      {r: 83, g: 176, b: 174}
    ];
    this.highlighted = 0;

    const prepareNode = (node, x, y, depth) => {
      if (node == null) {
        return;
      }
      node.prevX = node.nextX || width / 2;
      node.prevY = node.nextY || -this.r;
      node.nextX = x;
      node.nextY = y;
      node.nextXYTimestamp = millis() + this.frameDuration;
      node.x = node.prevX;
      node.y = node.prevY;
      if (node.left != null) {
        prepareNode(node.left, x - Math.pow(2, depth - 1) * (this.r + this.mh), y + this.d + this.mv, depth - 1);
      }
      if (node.right != null) {
        prepareNode(node.right, x + Math.pow(2, depth - 1) * (this.r + this.mh), y + this.d + this.mv, depth - 1);
      }
    };

    const prepareTree = () => prepareNode(tree.root, width / 2, this.r + this.mv, tree.maxDepth() - 1);

    prepareTree();

    const prepareTreeDecorator = (decorated) => {
      return function() {
        decorated.apply(tree, arguments);
        prepareTree();
      };
    };

    tree.addValue = prepareTreeDecorator(BinarySearchTree.prototype.addValue);
    tree.removeValue = prepareTreeDecorator(BinarySearchTree.prototype.removeValue);
  }

  colorNode(node, color) {
    node.prevColor = node.nextColor || this.defaultColor;
    node.nextColor = color;
    node.nextColorTimestamp = millis() + this.frameDuration;
    node.color = node.prevColor;
  }

  highlightValue(value) {
    this.colorNode(this.tree.findNode(value), this.highlightColors[this.highlighted++ % this.highlightColors.length]);
  }

  highlightValues(values) {
    const color = this.highlightColors[this.highlighted++ % this.highlightColors.length]
    for (let value of values) {
      this.colorNode(this.tree.findNode(value), color);
    }
  }

  unhighlightValue(value) {
    this.colorNode(this.tree.findNode(value), this.defaultColor);
    this.highlighted--;
  }

  unhighlightValues(values) {
    for (let value of values) {
      this.colorNode(this.tree.findNode(value), this.defaultColor);
    }
    this.highlighted--;
  }

  draw() {
    const drawNode = (node) => {
      if (node == null) {
        return;
      }
      const time = millis();
      if (time < node.nextXYTimestamp) {
        const c = (this.frameDuration - node.nextXYTimestamp + time) / this.frameDuration;
        node.x = node.prevX + (node.nextX - node.prevX) * c;
        node.y = node.prevY + (node.nextY - node.prevY) * c;
      } else {
        node.x = node.nextX;
        node.y = node.nextY;
      }
      if (node.left != null) {
        line(node.x, node.y, node.left.x, node.left.y);
      }
      if (node.right != null) {
        line(node.x, node.y, node.right.x, node.right.y);
      }
      if (node.color) {
        if (time < node.nextColorTimestamp) {
          const c = (this.frameDuration - node.nextColorTimestamp + time) / this.frameDuration;
          node.color = {
            r: node.prevColor.r + (node.nextColor.r - node.prevColor.r) * c,
            g: node.prevColor.g + (node.nextColor.g - node.prevColor.g) * c,
            b: node.prevColor.b + (node.nextColor.b - node.prevColor.b) * c
          };
        } else {
          node.color = node.nextColor;
        }
        fill(color(node.color.r, node.color.g, node.color.b));
      } else {
        fill(255);
      }
      circle(node.x, node.y, this.d);
      fill(0);
      textAlign(CENTER, CENTER);
      textSize(this.fontSize);
      text(node.value, node.x, node.y);
      drawNode(node.left);
      drawNode(node.right);
    }
    drawNode(this.tree.root);
  };
}

let tree,
    animation,
    treeRenderer,
    values = [7, 3, 10, 4, 9, 5, 8, 1, 0, 11, 12, 2];

function setup() {
  createCanvas(1280, 720);

  tree = new BinarySearchTree(values);
  animation = new Animation(500);
  treeRenderer = new TreeRenderer(tree, animation, {
    radius: 40,
    fontSize: 20,
    margins: {
      horizontal: 10,
      vertical: 20
    }
  });

  let i = 0;
  animation
    .animate(() => tree.addValue(values[i++]), () => i < values.length)
    .animate(() => treeRenderer.highlightValue(2))
    .pause(2)
    .animate(() => tree.removeValue(2))
    .animate(() => treeRenderer.highlightValue(1))
    .pause(2)
    .animate(() => tree.removeValue(1))
    .animate(() => treeRenderer.highlightValues([10, 11]))
    .pause(2)
    .animate(() => tree.removeValue(10))
    .animate(() => treeRenderer.unhighlightValue(11))
    .animate(() => treeRenderer.highlightValues([7, 8]))
    .pause(2)
    .animate(() => tree.removeValue(7))
    .animate(() => treeRenderer.unhighlightValue(8))
    .animate(() => tree.removeValue(8))
    .animate(() => tree.removeValue(3))
    .animate(() => tree.removeValue(11))
    .animate(() => tree.removeValue(0))
    .animate(() => tree.removeValue(4))
    .animate(() => tree.removeValue(5))
    .animate(() => tree.removeValue(9))
    .animate(() => tree.removeValue(12))
    .animate(() => tree.depthFirstTraversal(node => console.log(node)))
    .play();
}

function draw() {
  background(255);
  treeRenderer.draw();
}
