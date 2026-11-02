// Pure round rules; visuals and timings live in mirror-game.js.
export const sequences = [['brush','towel'],['cup','brush','soap'],['towel','soap','towel','cup']];
export class MemoryGame {
  constructor(){this.reset();}
  reset(){this.round=0;this.index=0;this.failures=0;this.assisted=false;this.state='idle';}
  get sequence(){return sequences[this.round];}
  start(){this.index=0;this.state='watch';}
  ready(){this.state='input';}
  choose(item){
    if(this.state!=='input')return 'ignored';
    if(item!==this.sequence[this.index]){this.failures++;this.index=0;this.state='retry';return 'wrong';}
    this.index++;
    if(this.index===this.sequence.length){this.state='between';return 'round';}
    return 'correct';
  }
  next(){
    if(this.state!=='between')return false;
    if(this.round===sequences.length-1){this.state='complete';return false;}
    this.round++;this.failures=0;this.assisted=false;this.start();return true;
  }
}
