'use strict';

var model, reverb;
var notes, radiusFactor, maxVelocity;

function setup() {
  createCanvas(window.innerWidth - 20, window.innerHeight - 20);
  frameRate(30);
  colorMode(HSB, 360, 170, 100);
  ellipseMode(RADIUS);
  reverb = new p5.Reverb();
  reverb.set(1.7);
  reverb.connect(p5.soundOut);
  notes = shuffle(['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'Bb', 'B'])
  var shortestSide = (height < width ? height : width)
  radiusFactor = shortestSide / 40
  maxVelocity = shortestSide / 80
  model = new Model();
}

function draw() {
  background(30);
  model.move();
}

function mouseClicked() {
  getAudioContext().resume();
  var mX = constrain(mouseX, 0, width)
  var mY = constrain(mouseY, 0, height)
  model.addBall(mX, mY);
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

Model.prototype.addBall = function(x, y, dx, dy) {
  if(this.balls.length < this.maxPopulation){
    this.balls.push(new Ball(x, y, this.balls));
    this.lastBallAddedTime = Date.now();
  }
}

Model.prototype.populate = function() {
  if (Date.now() > this.lastBallAddedTime + this.ballAddInterval &&
      this.balls.length < this.minPopulation
    ) {
    this.addBall()
  }
}

Model.prototype.move = function() {
  this.populate();
  var dead = [];
  // calculate movements
  for (var b = 0; b < this.balls.length; b++){
    var ball = this.balls[b];
    ball.move();
    ball.draw();
    ball.play()
    if (ball.lifeSpan <= 0) {
      dead.push(b);
    }
  }
  // bring out your dead
  for(var i = dead.length - 1; i >= 0 ; i--){
    this.balls.splice(dead[i], 1);
    if (this.balls.length < this.minPopulation) {
      this.lastBallAddedTime = Date.now();
    }
  }
}

var Ball = function (x, y, balls) {
  var xPos = x || random(width)
  var yPos = y || random(height)
  this.balls = balls;
  this.note = Math.floor(random(0, 11));
  this.octave = Math.floor(random(0, 3));
  this.mass = 1;
  this.radius = (4 - this.octave) * radiusFactor;; 
  this.position = this.findPosition(x, y);
  this.velocity = createVector(random(0 - maxVelocity, maxVelocity), random(0 - maxVelocity, maxVelocity))
  this.nextVelocity = createVector(this.velocity.x, this.velocity.y);
  this.lifeSpan = 12;
  this.synth = new p5.MonoSynth();
  this.synth.connect(reverb)
  this.needsPlay = false;
}

Ball.prototype.findPosition = function(x, y) {
  if (x != null && y != null) {
    return createVector(x, y)
  }
  var r = this.radius
  var xPos, yPos
  var collision = false
  // keep getting random position until we have one that isn't too close to any other balls
  do {
    xPos = constrain(random(width), r + 1, width - r - 1)
    yPos = constrain(random(height), r + 1, height - r - 1)
    for (var b = 0; b < this.balls.length; b++){
      var ball = this.balls[b];
      if (ball === this) {
        continue;
      }
      var position = createVector(xPos, yPos)
      if (ball.position.dist(position) < this.radius + ball.radius) {
        collision = true;
        console.log("Too close:", ball.position.dist(position))
        break
      }
      else {
        collision = false;
      }
      
    }
  }
  while (collision === true);

  return createVector(xPos, yPos)
}

Ball.prototype.move = function() {
  this.checkWalls()
  // check for collisions with other balls
  for(var b = 0; b < this.balls.length; b++){
    var ball = this.balls[b];
    this.collision(ball);
  }
  this.position.add(this.velocity);
}

Ball.prototype.checkWalls = function() {
  if (this.position.x + this.radius >= width ||
      this.position.x <= this.radius) {
    this.velocity.x = this.velocity.x * -1;
    this.touched()
  }
  if (this.position.y + this.radius >= height ||
      this.position.y <= this.radius) {
    this.velocity.y = this.velocity.y * -1;
    this.touched()
  }
}

Ball.prototype.touched = function(){
  this.needsPlay = true;
  this.lifeSpan -= 1;
}

Ball.prototype.collision = function(ball) {
  var distance = this.position.dist(ball.position)
  var minDistance = this.radius + ball.radius 
  if (ball == this || distance > minDistance) {
    return
  }
  // balls colliding. First, move them apart.
  var angle = p5.Vector.sub(this.position, ball.position).heading()
  var distanceVector = p5.Vector.sub(this.position, ball.position)
  var newDistance = createVector(minDistance * cos(angle), minDistance * sin(angle))
  var xNudge = distanceVector.x - newDistance.x
  var yNudge = distanceVector.y - newDistance.y
  this.position.sub(xNudge / 2, yNudge / 2)
  ball.position.add(xNudge / 2, yNudge / 2)
  // return
  // Thank you Adam Brookes http://cobweb.cs.uga.edu/~maria/classes/4070-Spring-2017/Adam%20Brookes%20Elastic%20collision%20Code.pdf
  // Normalise distance vector, find tangent vector
  var normalVector = distanceVector.normalize()
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

  this.touched()
  ball.touched()
}

Ball.prototype.draw = function() {
  if(this.lifeSpan > 0){
    var hue = this.note * 360 / 12
    fill(hue, 100, 100)
    noStroke()
    ellipse(this.position.x, this.position.y, this.radius, this.radius);
  }
}

Ball.prototype.play = function() {
  if(this.needsPlay == true){
    this.synth.oscillator.pan(this.position.x / (width / 2) - 1)
    var note = notes[this.note]
    var octave = ['3', '4', '5', '6'][this.octave]
    this.synth.play(note + octave, 0.4, 0.1, 0.1);
    if(this.lifeSpan > 0 ){
      this.note += 1;
    }
    if(this.note == 12){
      this.note = 0;
    }
    this.needsPlay = false
  }
}