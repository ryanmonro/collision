'use strict';

var model, reverb;
var notes;
// console.log(Tonal.transpose("C4", "2M"))

function setup() {
  createCanvas(window.innerWidth - 20, window.innerHeight - 20);
  frameRate(30);
  colorMode(HSB, 360, 170, 100);
  ellipseMode(RADIUS);
  reverb = new p5.Reverb();
  reverb.set(1.7);
  reverb.connect(p5.soundOut);
  notes = shuffle(['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'Bb', 'B'])
  model = new Model();
  // contrived balls for testing weird cases
  var b1 = new Ball(width / 2 - 300,height / 2, model.balls);
  b1.radius = 20
  b1.velocity.x = 5
  b1.velocity.y = 0
  // model.balls.push(b1);
  var b2 = new Ball(width / 2 + 300,height / 2, model.balls);
  b2.radius =  30
  b2.velocity.x = -5// -16
  b2.velocity.y = 0
  // model.balls.push(b2);
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
  this.minPopulation = 5;
  this.maxPopulation = 10;
  this.lastBallAddedTime = 0;
  this.ballAddInterval = 1000;
  this.frame = 0;
}

Model.prototype.add = function(x, y, dx, dy) {
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
  // this.frame += 1;
  this.populate();
  var dead = [];
  for (var b = 0; b < this.balls.length; b++){
    var ball = this.balls[b];
    ball.move();
    ball.draw();
    if (ball.lifeSpan <= 0) {
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
  this.note = Math.floor(random(0, 11));
  this.octave = Math.floor(random(0, 3));
  var r = (4 - this.octave) * 20;
  this.radius = r; // 20 should be related to screen size
  this.position = createVector(constrain(x, r + 1, width - r - 1), constrain(y, r + 1, height - r - 1));
  this.velocity = createVector(random(-10, 10), random(-10, 10))
  this.nextVelocity = createVector(this.velocity.x, this.velocity.y);
  this.lifeSpan = 12;
  this.synth = new p5.MonoSynth();
  // this.synth.connect(reverb);
}

Ball.prototype.move = function() {
  this.collision();
  this.position.add(this.velocity);
}

Ball.prototype.mass = function() {
  return 1
  // return 4 / 3 * PI * this.radius * this.radius * this.radius;
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
        // console.log(b, distance)
        // console.log(model.frame, b, this.position.dist(ball.position), this.velocity.x, ball.velocity.x)
        this.changeVectors(ball);
        // console.log(b, this.position.dist(ball.position), this.velocity.x, ball.velocity.x)
        needsBounce = true;
        ball.bounce();
      }
    }
  }
  needsBounce && this.bounce();
}

Ball.prototype.changeVectors = function(ball) {
  var angle = p5.Vector.sub(this.position, ball.position).heading()
  var distance = this.position.dist(ball.position)
  // balls colliding. First, move them apart.
  var overlap = (distance - this.radius - ball.radius) / 2
  console.log(overlap)
  var minDistance = this.radius + ball.radius 
  var difference = p5.Vector.sub(this.position, ball.position)
  var newPos = createVector(minDistance * cos(angle), minDistance * sin(angle))
  
  // Okay but move each one by half.
  ball.position.add(difference.x - newPos.x, difference.y - newPos.y)


  // this.position.sub(overlap * (this.position.x - ball.position.x) / distance, overlap * (this.position.y - ball.position.y) / distance)
  // ball.position.add(overlap * (this.position.x - ball.position.x) / distance, overlap * (this.position.y - ball.position.y))



  // ball.position = p5.Vector.add(this.position, newPos)
  // console.log(ball.position)
  
  // return
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
  var thisScalarNormalAfter = (thisScalarNormal * (this.mass() - ball.mass()) + 2 * ball.mass() * ballScalarNormal) / (this.mass() + ball.mass());
  var ballScalarNormalAfter = (ballScalarNormal * (ball.mass() - this.mass()) + 2 * this.mass() * thisScalarNormal) / (this.mass() + ball.mass());

  // convert to vectors
  var thisScalarNormalAfterVector = p5.Vector.mult(normalVector, thisScalarNormalAfter);
  var ballScalarNormalAfterVector = p5.Vector.mult(normalVector, ballScalarNormalAfter);
  var thisScalarNormalVector = p5.Vector.mult(tangentVector, thisScalarTangential);
  var ballScalarNormalVector = p5.Vector.mult(tangentVector, ballScalarTangential);

  // add normal and tangentials for each ball
  // console.log(this.velocity)
  this.velocity = p5.Vector.add(thisScalarNormalVector, thisScalarNormalAfterVector);
  // console.log(this.velocity)
  ball.velocity = p5.Vector.add(ballScalarNormalVector, ballScalarNormalAfterVector);
}

Ball.prototype.draw = function() {
  var hue = this.note * 360 / 12
  fill(hue, 100, 100)
  noStroke()
  // noFill()
  ellipse(this.position.x, this.position.y, this.radius, this.radius);
}

Ball.prototype.bounce = function() {
  // this.synth.pan(1)
  var note = notes[this.note]
  var octave = ['3', '4', '5', '6'][this.octave]
  // console.log(note, octave, this.octave)
  this.synth.play(note + octave, 0.1, 0.01, 0.1);
  this.lifeSpan -= 1;
  if(this.lifeSpan > 0 ){
    this.note += 1;
  }
  if(this.note == 12){
    this.note = 0;
    // this.octave += 1;
  }
}