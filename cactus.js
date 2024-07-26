'use strict'

const canvas= document.getElementById('canvas');
const ctx= canvas.getContext('2d');
canvas.width= 355
canvas.height= 200




// image
let human_array= []
for (let i= 1; i<= 6; i++) {
  let human_img= new Image();
  human_img.src= `public/${i}.png`
  human_array.push(human_img);
}
let jumpOnImg= new Image();
let jumpIngImg= new Image();
let jumpDownImg= new Image();
let cactus_img= new Image();
let cactus_img2= new Image();
let star_img= new Image();
jumpOnImg.src= 'public/jump on.png'
jumpIngImg.src= 'public/jump ing.png'
jumpDownImg.src= 'public/jump down.png'
cactus_img.src= 'public/cactus.png'
cactus_img2.src= 'public/cactus2.png'
star_img.src= 'public/star.png'




// game status
let game_state= 'intro'

// score
let current_score= 0
let high_score= localStorage.getItem('high_score') || 0

// 사운드
const audioCtx= new window.AudioContext();
function playBeep(frequency, startTime, duration) {
  const oscillator= audioCtx.createOscillator();
  const gainNode= audioCtx.createGain();
  oscillator.connect(gainNode);
  gainNode.connect(audioCtx.destination);
  oscillator.type= 'sine';
  oscillator.frequency.setValueAtTime(frequency, startTime);
  oscillator.start(startTime);
  gainNode.gain.setValueAtTime(1, startTime);
  gainNode.gain.exponentialRampToValueAtTime(0.00001, startTime + duration);
  oscillator.stop(startTime + duration);
}
function playJumpSound() {
  playBeep(1440, audioCtx.currentTime, 0.1);
}
function playGameOverSound() {
  playBeep(250, audioCtx.currentTime, 0.05);
  playBeep(250, audioCtx.currentTime + 0.15, 0.05);
}






// Human
class Human {
  constructor() {
    this.x= 10
    this.y= canvas.height - 30
    this.width= 30
    this.height= 30
    this.velocity_y= 0
    this.gravity= 0.5
    this.jumping= false
    this.frame= 0
    this.frame_interval= 10
    this.frame_timer= 0
  }

  draw() {
    let human_img
    if (this.jumping) {
      if (this.velocity_y < 0) {
        human_img= jumpOnImg
      } else if (this.velocity_y >= 0 && this.y < canvas.height - 120) {
        human_img= jumpIngImg
      } else {
        human_img= jumpDownImg
      }
    } else {
      this.frame_timer++
      if (this.frame_timer>= this.frame_interval) {
        this.frame= (this.frame + 1) % human_array.length
        this.frame_timer= 0
      }
      human_img= human_array[this.frame]
    }
    ctx.drawImage(human_img, this.x, this.y, this.width, this.height);
  }

  update() {
    if (this.jumping) {
      this.velocity_y += this.gravity
      this.y+= this.velocity_y
      if (this.y + this.height >= canvas.height) {
        this.y= canvas.height - this.height
        this.jumping= false
        this.velocity_y= 0
      }
    }
  }

  jump() {
    if (!this.jumping) {
      this.jumping= true
      this.velocity_y= -10
      playJumpSound();
    }
  }
}
let human = new Human();




// Cactus
class Cactus {
  constructor() {
    this.x= canvas.width
    this.y= canvas.height - 42
    this.width= 30
    this.height= 45
  }

  draw() {
    ctx.drawImage(cactus_img, this.x, this.y, this.width, this.height);
  }

  update() {
    this.x -= 4
  }
}




// Cactus2
class Cactus2 {
  constructor() {
    this.x= canvas.width
    this.y= canvas.height - 42
    this.width= 30
    this.height= 45
  }

  draw() {
    ctx.drawImage(cactus_img2, this.x, this.y, this.width, this.height);
  }

  update() {
    this.x -= 4;
  }
}




// Star
class Star {
  constructor() {
    this.x= Math.random() * canvas.width
    this.y= Math.random() * canvas.height
    this.size= Math.random() * 2 + 1
    this.speed= Math.random() * 0.5 + 0.5
  }

  draw() {
    ctx.drawImage(star_img, this.x, this.y, this.size * 10, this.size * 10);
  }

  update() {
    this.x -= this.speed
    if (this.x < 0) {
      this.x= canvas.width
      this.y= Math.random() * canvas.height
      this.size= Math.random() * 2 + 1
      this.speed= Math.random() * 0.5 + 0.5
    }
  }
}
let stars= []
const numberOfStars= 3
for (let i = 0; i < numberOfStars; i++) {
  stars.push(new Star());
}




// variable
let gameover= false
let cactus_array= []
let cactus2_array= []
let timer= 0
let animation
let last_cactus_time= 0 // last cactus spawn time
let last_cactus2_time= 0
const cactusInterval= 240 // cactus spawn interval
const cactus2Interval= 500
const minCactusGap= 100 // minimum gap time between cactus




// intro
function drawIntro() {
  ctx.fillStyle= 'black'
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.font= '28px serif'
  ctx.fillStyle= 'white'
  ctx.textAlign= 'center'
  ctx.fillText('cactus jumping', canvas.width / 2, canvas.height / 3);
  ctx.font= '20px serif'
  ctx.fillText('space to start', canvas.width / 2, canvas.height / 2);
}

// score
function drawScore() {
  ctx.font= '15px serif'
  ctx.fillStyle= 'black'
  ctx.textAlign= 'right'
  ctx.fillText(`Score: ${current_score}`, canvas.width - 20, 30);
  ctx.fillText(`High Score: ${high_score}`, canvas.width - 20, 50);
}




// game loop
function frame60() {

  gameover ? null : animation = requestAnimationFrame(frame60);

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (game_state === 'intro') {
    drawIntro();
  } else if (game_state === 'playing') {
    timer++;
    current_score= Math.floor(timer / 10);

    stars.forEach(e=> {
      e.update();
      e.draw();
    });

    human.update();
    human.draw();

    drawScore();
    



    // cactus gen
    if (timer - last_cactus_time > cactusInterval) {
      let cactus= new Cactus();
      cactus_array.push(cactus);
      last_cactus_time= timer;
    }
    cactus_array.forEach((cactus, index, array)=> {
      if (cactus.x + cactus.width < 0) {
        array.splice(index, 1);
      }
      cactus.update();
      cactus.draw();
      collision_detection(human, cactus);
    });

    // cactus2 gen
    if (timer - last_cactus2_time > cactus2Interval && timer - last_cactus_time > minCactusGap) {
      let cactus2= new Cactus2();
      cactus2_array.push(cactus2);
      last_cactus2_time = timer;
    }
    cactus2_array.forEach((cactus2, index, array) => {
      if (cactus2.x + cactus2.width < 0) {
        array.splice(index, 1);
      }
      cactus2.update();
      cactus2.draw();
      collision_detection(human, cactus2);
    });

    if (gameover) {
      ctx.fillStyle = 'rgba(128, 128, 128, 0.5)' // translucent gray
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.font= '32px serif'
      ctx.fillStyle= 'black'
      ctx.textAlign= 'center'
      ctx.fillText('game over', canvas.width / 2, canvas.height / 2 - 24);
      create_restartbutton();
    }
  }
}
frame60();




// collision
function collision_detection(human, cactus) {
  const h_left= human.x
  const h_right= human.x + human.width
  const h_top= human.y
  const h_bot= human.y + human.height
  const c_left= cactus.x
  const c_right= cactus.x + cactus.width
  const c_top= cactus.y
  const c_bot= cactus.y + cactus.height

  if (h_right > c_left && h_left < c_right && h_bot > c_top && h_top < c_bot) {
    gameover= true
    cancelAnimationFrame(animation);
    playGameOverSound();

    // update high score
    if (current_score > high_score) {
      high_score= current_score
      localStorage.setItem('high_score', high_score);
    }
  }
}



// restart button
function create_restartbutton() {
  let button= document.createElement('img');
  button.src= `public/restart.png`
  button.style.position = 'absolute'
  button.style.left= `${canvas.offsetLeft + canvas.width / 2}px`
  button.style.top= `${canvas.offsetTop + canvas.height / 2}px`
  button.style.transform= 'translateX(-50%)'
  button.style.width= '100px'
  document.body.appendChild(button);

  button.addEventListener('click', $=> {
    document.body.removeChild(button);
    restartGame();
  });
}

function restartGame() {
  gameover= false
  game_state= 'playing'
  human= new Human();
  cactus_array= []
  cactus2_array= []
  timer= 0
  current_score= 0
  last_cactus_time= 0
  last_cactus2_time= 0
  frame60();
}




// jump and start
document.addEventListener('keydown', e=> {
  if (e.code === 'Space') {
    if (game_state === 'intro') {
      game_state= 'playing'
    } else if (!gameover) {
      human.jump();
    }
  }
});

// double click
canvas.addEventListener('dblclick', e=> {
  e.preventDefault();
});

// dont move
window.addEventListener('touchmove', e=> {
  e.preventDefault();
}, { passive: false });

// jump
document.addEventListener('touchstart', $=> {
  if (game_state === 'intro') {
    game_state= 'playing'
  } else if (!gameover) {
    human.jump();
  }
});
