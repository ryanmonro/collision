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
  background(60);
  // fill(random(360), 100, 100);
  // noStroke();
  // ellipse(250, 250, 30, 30);

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
  this.balls.push(new Ball(x || width / 2, y || height / 2, this.balls));
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
  // bring out your dead
  for(var i = 0; i < dead.length; i++){
    this.balls.splice(dead[i], 1);
    this.lastBallRemovedTime = Date.now();
  }
}

var Ball = function (x, y, balls) {
  this.balls = balls;
  this.radius = 30; // random(10, 50)
  this.position = createVector(x, y);
  var xVel = random(1,9)
  this.velocity = createVector(xVel, 10 - xVel)
  this.nextVelocity = createVector(this.velocity.x, this.velocity.y);
  this.lifeSpan = 9;
  this.hue = random(360);
  this.note = randomNote();
  this.synth = new p5.MonoSynth();
  this.synth.connect(reverb);
}

Ball.prototype.move = function() {
  // this.velocity = this.nextVelocity;
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
        // balls colliding. First, move them apart.
        // var overlap = minDistance - distance
        var difference = p5.Vector.sub(this.position, ball.position)
        var angle = p5.Vector.sub(this.position, ball.position).heading()
        var x = minDistance * cos(angle)
        var y = minDistance * sin(angle) 
        var newDifference = createVector(x, y)
        var change = p5.Vector.sub(difference, newDifference)
        // ball.position.add(change)
        ball.position.add(difference.x - x, difference.y - y)

        // change their velocities
        if ((this.velocity.x > 0 && ball.velocity.x < 0) ||
            (this.velocity.x < 0 && ball.velocity.x > 0)) {
          this.velocity.x = this.velocity.x * -1;
        }
        if ((this.velocity.y > 0 && ball.velocity.y < 0) ||
            (this.velocity.y < 0 && ball.velocity.y > 0)) {
          this.velocity.y = this.velocity.y * -1;
        }
        // needsBounce = true;
      }
    }
  }
  needsBounce && this.bounce();
}

Ball.prototype.draw = function() {
  fill(this.hue, 100, 100);
  noStroke();
  ellipse(this.position.x, this.position.y, this.radius, this.radius);
  fill(0,0,0);
  textSize(32);
  text(this.lifeSpan, this.position.x, this.position.y);
}

Ball.prototype.bounce = function() {
  this.synth.play(this.note, 0.1, 0.01, 0.1);
  this.lifeSpan -= 1;
}

function pickOne(arr){
  return shuffle(arr)[0];
}