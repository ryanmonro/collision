// This is cool, but...
/* heading back to the original idea at the museum:
it could draw the squares gradually, drawing one per draw() call
and play a note on each one
mouse position still determines proportion of colours
you will hear the difference more than see it
10 calls per second, 5 seconds per line
if it's too tedious let's draw multiple lines simultaneously
when the grid is full, start again from the top without clearing
Next question: what happens on mobile?
*/

'use strict';

var width;
var height;
var synth;
var sloop;
// var balls;
var model;

function setup() {
  width = 500;
  height = 500;
  synth = new p5.PolySynth();
  createCanvas(width, height);
  frameRate(30);
  colorMode(HSB, 360, 100, 100);
  ellipseMode(RADIUS);
  sloop = new p5.SoundLoop(soundLoop, 0.125);
  model = new Model();
}

function soundLoop(time){
  // synth.play(note, 0.1, 0, 0.1);
}

function draw() {
  background(0);
  model.move();
  // model.draw();
}

function mouseClicked() {
  getAudioContext().resume();
  if (sloop.isPlaying) {
    sloop.pause();
  } else {
    sloop.start();
  }
  var mX = constrain(mouseX, 0, width)
  var mY = constrain(mouseY, 0, height)
}

function keyPressed(){
  if (key == 's' || key == 'S') saveCanvas(gd.timestamp(), 'png');
}

function randomNote() {
  return shuffle(['C', 'D', 'E', 'G', 'A'])[0] + "4";
}

var Model = function () {
  this.balls = []
  this.add()
}

Model.prototype.add = function() {
  this.balls.push(new Ball(width / 3, height / 2));
}

Model.prototype.move = function() {
  this.balls[0].move();
  this.balls[0].draw();
}

var Ball = function (x, y) {
  this.radius = 20;
  this.position = createVector(x, y);
  this.hDir = 10;
  this.vDir = 9;
  this.lifeSpan = 9;
  this.note = randomNote();
}

Ball.prototype.move = function() {
  this.position.x += this.hDir;
  this.position.y += this.vDir;
  var needsBounce = false;
  if (this.position.x + this.radius >= width ||
      this.position.x - this.radius <= 0) {
    this.hDir = this.hDir - 2 * this.hDir;
    needsBounce = true;
  }
  if (this.position.y + this.radius >= width ||
      this.position.y - this.radius <= 0) {
    this.vDir = this.vDir - 2 * this.vDir;
    needsBounce = true;
  }
  needsBounce && this.bounce();
}

Ball.prototype.draw = function() {
  ellipse(this.position.x, this.position.y, this.radius, this.radius);
}

Ball.prototype.bounce = function() {
  synth.play(this.note, 0.1, 0, 0.1);
  this.lifeSpan -= 1;
}