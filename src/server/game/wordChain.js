const Game = require("./game");
const socketEvent = require("../constants/socketEvents");
const request = require('request')

const key = process.env.DICTIONARY_KEY
const addr = "https://stdict.korean.go.kr/api/search.do?key=" + key + "&req_type=json&q="

const consonants = ['ㄱ', 'ㄴ', 'ㄷ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅅ', 'ㅇ', 'ㅈ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];
const wrongReason = {
    length: '글자 수를 맞춰주세요',
    already: '이미 사용한 단어입니다',
    character: '이어지는 글자가 다릅니다',
    word: '표준대국어사전에 없는 단어입니다',
}

class Hunmin extends Game{
    constructor(room) {
        super(room);
        this.playerSeq = [];
        this.len = 0;
        this.turn = 0;
        this.nowWord = ''
        this.wordList = [];
        this.finish = false;
    }
    
    start(){
        let suggest = consonants[parseInt(Math.random()*14)] + consonants[parseInt(Math.random()*14)];
        this.nowWord = suggest;
        this.len = this.playerSeq.length;
        this.playerSeq.sort((a,b)=>{return a[1]-b[1]});
        for(let i=0; i < this.len; i++){
            this.getRoomSocket().emit("join_user", {
                id: this.playerSeq[i][0],
                seq: i,
            });
        }
        this.getRoomSocket().emit('suggestInitial', suggest);

        setTimeout(()=>{
            if(this.finish) return;
            let loser = this.playerSeq[this.turn%this.len][0];
            this.getRoomSocket().emit(socketEvent.gameEnd, loser);
            this.comebackRoom();
        }, 10000);
    }

    disconnect(id){
        if(this.room.players[id]){
            this.leftGame(id);
        }
        this.getRoomSocket().emit("leave_user", id);
    }

    joinGame(id){
        this.playerSeq.push([id, Math.random()])
    }

    leftGame(id){
        for(let i=0; i < this.len; i++){
            if(this.playerSeq[i][0] === id){
                // this.playerSeq.splice(i,1);
                this.playerSeq[i] = false;
                break;
            }
        }
    }

    charaterSeprate(char){
        const f = ['ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ',
        'ㅂ', 'ㅃ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ',
        'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];

        const s = ['ㅏ', 'ㅐ', 'ㅑ', 'ㅒ', 'ㅓ', 'ㅔ', 'ㅕ',
        'ㅖ', 'ㅗ', 'ㅘ', 'ㅙ', 'ㅚ', 'ㅛ', 'ㅜ',
        'ㅝ', 'ㅞ', 'ㅟ', 'ㅠ', 'ㅡ', 'ㅢ', 'ㅣ'];
                
        const t = ['', 'ㄱ', 'ㄲ', 'ㄳ', 'ㄴ', 'ㄵ', 'ㄶ',
        'ㄷ', 'ㄹ', 'ㄺ', 'ㄻ', 'ㄼ', 'ㄽ', 'ㄾ',
        'ㄿ', 'ㅀ', 'ㅁ', 'ㅂ', 'ㅄ', 'ㅅ', 'ㅆ',
        'ㅇ', 'ㅈ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];

        const ga = 44032;
        let uni = char.charCodeAt(0);
    
        uni = uni - ga;
    
        let fn = parseInt(uni / 588);
        let sn = parseInt((uni - (fn * 588)) / 28);
        let tn = parseInt(uni % 28);

        return [f[fn], s[sn], t[tn]];
    }

    initialSoundRule(initial){
        if(initial === 'ㄴ'){
            return ['ㄴ','ㅇ']
        }else if(initial === 'ㄹ'){
            return ['ㄹ','ㄴ','ㅇ']
        }else{
            return [initial];
        }
    }

    checkWord(word){
        if(word.length < 2) return [false, wrongReason.length];
        if(this.wordList.includes(word)) return [false, wrongReason.already]
        let start = this.charaterSeprate(word[0])
        let end = this.charaterSeprate(this.wordList[this.wordList.length-1].slice(-1)[0])
        if(end[1] !== start[1] || end[2] !== start[2] || (!this.initialSoundRule(end[0]).includes(start[0]))) return [false, wrongReason.character];
        request.get(addr+encodeURI(word),(err, resoponse, body) =>{
            if(err){
                console.log(err);
            }
            if(body) return [true, ''];
            return [false, wrongReason.word];
        })
    }

    initializeSocketEvents(id, socket, nickname){

        this.joinGame(id);

        socket.on('word', async data=>{
            let result = await this.checkWord(data)
            if(result[0]){
                this.wordList.push(data)
                do{
                    this.turn++
                }while(!this.playerSeq[this.turn%this.len]);
                this.getRoomSocket.emit('pass',{
                    turn: this.turn%this.len,
                    word: data,
                });
                let now = this.turn;
                setTimeout(()=>{
                    if(now !== this.turn) return;
                    this.finish = true;
                    let loser = this.playerSeq[this.turn%this.len][0];
                    this.getRoomSocket().emit(socketEvent.gameEnd, loser);
                    this.comebackRoom();
                },5000)
            }else{
                this.getRoomSocket.emit('fail', result[1])
            }
        })
    }
}

module.exports = Hunmin;