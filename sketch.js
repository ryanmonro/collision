'use strict';

var model, reverb;
// console.log(Tonal.transpose("C4", "2M"))

function setup() {
  createCanvas(window.innerWidth - 20, window.innerHeight - 20);
  frameRate(30);
  colorMode(HSB, 360, 100, 100);
  ellipseMode(RADIUS);
  reverb = new p5.Reverb();
  reverb.set(1.7);
  reverb.connect(p5.soundOut);
  model = new Model();
}

function draw() {
  background(20);
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
  return random(['C', 'D','F', 'G', 'A']) + random(["4","5","6"]);
}

var Model = function () {
  this.balls = [];
  this.minPopulation = 3;
  this.maxPopulation = 8;
  this.lastBallAddedTime = 0;
  this.ballAddInterval = 1000;
}

Model.prototype.add = function(x, y) {
  if(this.balls.length <= this.maxPopulation){
    this.balls.push(new Ball(x || width / 2, y || height / 2, this.balls));
    this.lastBallAddedTime = Date.now();
  }
}

Model.prototype.populate = function() {
  if (Date.now() > this.lastBallAddedTime + this.ballAddInterval &&
      this.balls.length < this.minPopulation
    ) {
    this.add()
  }
}

Model.prototype.move = function() {
  this.populate();
  var dead = [];
  for (var b = 0; b < this.balls.length; b++){
    var ball = this.balls[b];
    ball.move();
    ball.draw();
    if (ball.lifeSpan == 0) {
      dead.push(b);
    }
  }
  // bring out your dead
  for(var i = 0; i < dead.length; i++){
    this.balls.splice(dead[i], 1);
    if (this.balls.length < this.minPopulation) {
      this.lastBallAddedTime = Date.now();
    }
  }
}

var Ball = function (x, y, balls) {
  this.balls = balls;
  var noteNumber = Math.floor(random(0, 11));
  this.note = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'Bb', 'B'][noteNumber];
  this.octave = random(['3', '4', '5', '6'])
  var octaveInt = parseInt(this.octave)
  this.radius = (7 - octaveInt) * 20; // 20 should be related to screen size
  this.position = createVector(x, y);
  var xVel = random(1,9)
  this.velocity = createVector(xVel, 10 - xVel)
  this.nextVelocity = createVector(this.velocity.x, this.velocity.y);
  this.lifeSpan = 9;
  // this.mass = 4 / 3 * PI * this.radius * this.radius * this.radius;
  this.mass = 1
  this.hue = noteNumber * 360 / 12;
  this.synth = new p5.MonoSynth();
  this.synth.connect(reverb);
}

Ball.prototype.move = function() {
  this.collision();
  this.position.add(this.velocity);
}

Ball.prototype.collision = function() {
  var needsBounce = false;
  // check walls
  if (this.position.x + this.radius >= width ||
      this.position.x <= this.radius) {
    this.velocity.x = this.velocity.x * -1;
    needsBounce = true;
  }
  if (this.position.y + this.radius >= height ||
      this.position.y <= this.radius) {
    this.velocity.y = this.velocity.y * -1;
    needsBounce = true;
  }
  // check other balls
  for(var b = 0; b < this.balls.length; b++){
    var ball = this.balls[b];
    if (ball !== this){
      var distance = this.position.dist(ball.position)
      var minDistance = this.radius + ball.radius
      if (distance < minDistance ) {
        this.changeVectors(ball);
        needsBounce = true;
        ball.bounce();
      }
    }
  }
  needsBounce && this.bounce();
}

Ball.prototype.changeVectors = function(ball) {
  // balls colliding. First, move them apart.
  var minDistance = this.radius + ball.radius
  var angle = p5.Vector.sub(this.position, ball.position).heading()
  var difference = p5.Vector.sub(this.position, ball.position)
  var newPos = createVector(minDistance * cos(angle), minDistance * sin(angle))
  ball.position.add(difference.x - newPos.x, difference.y - newPos.y)

  // Thank you Adam Brookes http://cobweb.cs.uga.edu/~maria/classes/4070-Spring-2017/Adam%20Brookes%20Elastic%20collision%20Code.pdf
  // Normalise distance vector, find tangent vector
  var normalVector = difference.normalize()
  var tangentVector = createVector(normalVector.y * -1, normalVector.x)
  
  // resolve velocity vectors into normal and tangential
  // ball scalar normal direction
  var thisScalarNormal = normalVector.dot(this.velocity)
  var ballScalarNormal = normalVector.dot(ball.velocity)
  // scalar velocities in tangential direction
  var thisScalarTangential = tangentVector.dot(this.velocity)
  var ballScalarTangential = tangentVector.dot(ball.velocity)

  // Find new velocities
  var thisScalarNormalAfter = (thisScalarNormal * (this.mass - ball.mass) + 2 * ball.mass * ballScalarNormal) / (this.mass + ball.mass);
  var ballScalarNormalAfter = (ballScalarNormal * (ball.mass - this.mass) + 2 * this.mass * thisScalarNormal) / (this.mass + ball.mass);

  // convert to vectors
  var thisScalarNormalAfterVector = p5.Vector.mult(normalVector, thisScalarNormalAfter);
  var ballScalarNormalAfterVector = p5.Vector.mult(normalVector, ballScalarNormalAfter);
  var thisScalarNormalVector = p5.Vector.mult(tangentVector, thisScalarTangential);
  var ballScalarNormalVector = p5.Vector.mult(tangentVector, ballScalarTangential);

  // add normal and tangentials for each ball
  this.velocity = p5.Vector.add(thisScalarNormalVector, thisScalarNormalAfterVector);
  ball.velocity = p5.Vector.add(ballScalarNormalVector, ballScalarNormalAfterVector);
}

Ball.prototype.draw = function() {
  fill(this.hue, 100, 100);
  noStroke();
  // noFill()
  ellipse(this.position.x, this.position.y, this.radius, this.radius);
}

Ball.prototype.bounce = function() {
  // this.synth.pan(1)
  console.log(this.note + this.octave)
  this.synth.play(this.note + this.octave, 0.1, 0.01, 0.1);
  this.lifeSpan -= 1;
}