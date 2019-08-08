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

var model, reverb;

function setup() {
  createCanvas(window.innerWidth / 2, window.innerHeight / 2);
  frameRate(30);
  colorMode(HSB, 360, 100, 100);
  ellipseMode(RADIUS);
  // sloop = new p5.SoundLoop(soundLoop, 0.125);
  reverb = new p5.Reverb();
  reverb.set(1.7);
  reverb.connect(p5.soundOut);
  model = new Model();
}

function soundLoop(time){
  // synth.play(note, 0.1, 0, 0.1);
}

function draw() {
  background(0);
  model.move();
}

function mouseClicked() {
  getAudioContext().resume();
  var mX = constrain(mouseX, 0, width)
  var mY = constrain(mouseY, 0, height)
  model.add(mX, mY);
}

function keyPressed(){
  if (key == 's' || key == 'S') saveCanvas(gd.timestamp(), 'png');
}

function randomNote() {
  return pickOne(['C', 'D', 'E','F', 'G', 'A','B']) + pickOne(["4","5","6"]);
}

var Model = function () {
  this.balls = [];
  this.minPopulation = 3;
  this.maxPopulation = 8;
  this.lastBallAddedTime = 0;
  this.lastBallRemovedTime = 0;
  this.ballAddInterval = 3000;
}

Model.prototype.add = function(x, y) {
  if (this.balls.length >= this.maxPopulation) {
    return
  }
  this.balls.push(new Ball(x || width / 2, y || height / 2));
  this.lastBallAddedTime = Date.now();
}

Model.prototype.move = function() {
  if (
      Date.now() > this.lastBallRemovedTime + this.ballAddInterval &&
      Date.now() > this.lastBallAddedTime + this.ballAddInterval
       &&
      this.balls.length < this.minPopulation
    ) {
    this.add();
  }
  var dead = [];
  for (var b = 0; b < this.balls.length; b++){
    var ball = this.balls[b];
    ball.move();
    ball.draw();
    if (ball.lifeSpan == 0) {
      dead.push(b);
    }
  }
  for(var i = 0; i < dead.length; i++){
    this.balls.splice(dead[i], 1);
    this.lastBallRemovedTime = Date.now();
  }
}

var Ball = function (x, y) {
  this.radius = 30 // Math.floor(Math.random() * 40) + 10;
  this.position = createVector(x, y);
  this.hDir = Math.floor(Math.random() * 9) + 1;
  this.vDir = 10 - this.hDir;
  this.lifeSpan = 9;
  this.hue = Math.floor(Math.random() * 360);
  this.note = randomNote();
  this.synth = new p5.MonoSynth();
  this.synth.connect(reverb);
}

Ball.prototype.move = function() {
  this.position.x += this.hDir;
  this.position.y += this.vDir;
  this.collision();
}

Ball.prototype.collision = function() {
  var needsBounce = false;
  if (this.position.x + this.radius >= width ||
      this.position.x - this.radius <= 0) {
    this.hDir = this.hDir - 2 * this.hDir;
    needsBounce = true;
  }
  if (this.position.y + this.radius >= height ||
      this.position.y - this.radius <= 0) {
    this.vDir = this.vDir - 2 * this.vDir;
    needsBounce = true;
  }
  needsBounce && this.bounce();
}

Ball.prototype.draw = function() {
  fill(this.hue, 100, 100)
  ellipse(this.position.x, this.position.y, this.radius, this.radius);
}

Ball.prototype.bounce = function() {
  this.synth.play(this.note, 0.1, 0, 0.1);
  this.lifeSpan -= 1;
}

function pickOne(arr){
  return shuffle(arr)[0];
}