/* Shared by the browser and the dependency-free rule tests. */
(function(root){
  const sequences=[['brush','towel'],['cup','brush','soap'],['towel','soap','towel','cup']];
  class MemoryGame {
    constructor(){this.reset();}
    reset(){this.round=0;this.index=0;this.failures=0;this.assisted=false;this.state='idle';}
    get sequence(){return sequences[this.round];}
    start(){this.state='watch';this.index=0;}
    ready(){this.state='input';}
    choose(item){
      if(this.state!=='input')return 'ignored';
      if(item!==this.sequence[this.index]){this.failures++;this.index=0;this.state='retry';return 'wrong';}
      this.index++;
      if(this.index===this.sequence.length){this.state='between';return 'round';}
      return 'correct';
    }
    next(){if(this.state!=='between')return false;if(this.round===sequences.length-1){this.state='complete';return false;}this.round++;this.failures=0;this.assisted=false;this.start();return true;}
  }
  root.MirrorMemory={MemoryGame,sequences};
  if(typeof module!=='undefined')module.exports=root.MirrorMemory;
})(typeof globalThis!=='undefined'?globalThis:this);
