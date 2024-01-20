phina.globalize();
const ASSETS = {
  // 画像
  image: {
    'othello_ban': "image/game_reversi_board.png",
    'black': "image/game_reversi_black.png",
    'white': "image/game_reversi_white.png",
  },
};
phina.define('Board_Space', {
  superClass: 'DisplayElement',
  init: function () {
    this.superInit();
    const width = height = 450;
    const mass_width = mass_height = 75;
    this.ban = Sprite('othello_ban').addChildTo(this);
    this.ban.alpha = 0.0;
    this.ban_base = RectangleShape({
      width: width,
      height: height,
      fill: 'green',
      stroke: 'black',
      strokeWidth: 20,
      cornerRadius: 2
    }).addChildTo(this);
    this.pieces = DisplayElement().addChildTo(this);
    this.mass = DisplayElement().addChildTo(this);
    // 将棋盤の当たり判定ます
    console.log("N_COLS, N_ROWS", N_COLS, N_ROWS);
    for (let i = 0; i < N_COLS; i++) {
      if (i != 0) {
        // 罫線
        RectangleShape({
          width: 3,
          height: height,
          fill: 'black',
          strokeWidth: 0,
          cornerRadius: 0
        }).addChildTo(this)
          .setPosition(this.posy_mass(i, mass_width) - 0.5 * mass_width,
            0, 2);
      }
    }
    for (let j = 0; j < N_ROWS; j++) {
      if (j != 0){
        // 罫線
        RectangleShape({
          width: width,
          height: 3,
          fill: 'black',
          strokeWidth: 0,
          cornerRadius: 0
        }).addChildTo(this)
        .setPosition(0,
          this.posy_mass(j,mass_height) - 0.5*mass_height
          ,2);
      }
      for (let i = 0; i < N_COLS; i++) {

        // RectangleShape
        let mass = xyToIdx(j, i);
        //console.log("mass:", mass);
        Mass({ number: mass, width: mass_width, height: mass_height }).addChildTo(this.mass)
          .setPosition(this.posx_mass(i,mass_width),
            this.posy_mass(j,mass_height),1)
          .on('pointstart', function () {
            // 駒を置くとき(ここに動くことは確定している)
            this.parent.parent.put_stone(this.number);
          });
        this.mass.children[mass].off_lighting();
      }
    }
    this.state = getInitialstate();
    this.turn = 1; // 1 or -1
    this.done = false;
  },
  posx_mass:function(number,mass_width){
    return mass_width * (number - (N_ROWS - 1) / 2) + 0;
  },
  posy_mass:function(number,mass_height){
    return mass_height * (number - (N_COLS - 1) / 2) + 0;
  },
  ready_put: function () {
    const valid_actions = getValidActions(this.state, this.turn);
    // 石を置けるところのタッチイベントを有効にして光らせる
    for (let j = 0; j < N_ROWS * N_COLS; j++) {
      if (valid_actions.includes(j)) {
        this.mass.children[j].setInteractive(true);
        this.mass.children[j].on_lighting();
      }
    }
    if (valid_actions[0] == ACTION_NOOP) {
      this.put_stone(ACTION_NOOP);
    }
  },
  put_stone: function (action) {
    console.log("action", action);
    const valid_actions = getValidActions(this.state, this.turn);
    if (!valid_actions.includes(action)) {
      throw new Error("action is not valid");
    }
    for (let j = 0; j < N_ROWS * N_COLS; j++) {
      this.mass.children[j].setInteractive(false);
      this.mass.children[j].off_lighting();
    }
    let done;
    console.log("state,action,turn");
    console.log(this.state, action, this.turn);
    [this.state, done] = step(this.state, action, this.turn);
    this.show();
    console.log("done",done);
    if(done){
      this.done = true;
    }else if(isDone(this.state,-this.turn)){
      this.done = true;
    }
    this.turn = this.turn * -1;
    return this.done;
  },
  get_valid_actions: function () {
    return getValidActions(this.state, this.turn);
  },
  is_game_over: function () {
    return this.done;
  },
  get_result: function () {
    return getResult(this.state);
  },
  count_stone: function () {
    return countStone(this.state);
  },
  show: function () {
    for (let j = 0; j < N_ROWS * N_COLS; j++) {
      //console.log("mass,this.state[j]", j, this.state[j]);
      this.mass.children[j].set_stone(this.state[j]);
    }
  },
  interactive_click: function (flag) {
    for(let i = 0; i< this.mass.children.length; i++) {
      this.mass.children[i].setInteractive(flag);
    }
  },
    
  });

phina.define('Mass', {
  superClass: 'DisplayElement',
  init: function ({ number, width = 45, height = 49 }) {
    this.superInit({
      width: width,
      height: height,
    });
    this.light = RectangleShape({
      width: width,
      height: height,
      fill: '#D9885B',
      // stroke: 'lime',
      strokeWidth: 0,
      cornerRadius: 0
    }).addChildTo(this);
    this.number = number;
    this.black = Sprite('black').addChildTo(this);
    this.black.alpha = 0.0;
    this.white = Sprite('white').addChildTo(this);
    this.white.alpha = 0.0;
    // 1:black,-1:white,0:empty
  },
  set_stone: function (stone) {
    if (stone == 1) {
      this.black.alpha = 1.0;
      this.white.alpha = 0.0;
    } else if (stone == -1) {
      this.black.alpha = 0.0;
      this.white.alpha = 1.0;
    } else if (stone == 0) {
      this.black.alpha = 0.0;
      this.white.alpha = 0.0;
    }
  },
  on_lighting: function () {
    this.light.alpha = 0.5;
  },
  off_lighting: function () {
    this.light.alpha = 0.0;
  },
});
phina.define('Result',{
	superClass: 'DisplayElement',
	init: function(){
		 this.superInit();
  },
});
/*
 * メインシーン
 */
phina.define("MainScene", {
  // 継承
  superClass: 'DisplayScene',
  // 初期化
  init: function () {
    // 親クラス初期化
    this.superInit();
    // 背景色
    this.backgroundColor = 'skyblue';

    this.last_turn = 1;
    this.gamefinished=false;

    this.board = Board_Space().addChildTo(this);
    this.board.setPosition(this.gridX.center(), this.gridY.center());
    this.board.show();
    // 入力を受け付ける
    this.board.ready_put()
  },
  // 毎フレーム更新処理
  update: function (app) {
    //console.log("turn", this.turn, "dragging", this.dragging, "pick",
    //this.pick, "put", this.put, "com_standby", this.com_standby);
    // console.log("is_game_over",this.board.is_game_over());
    if (this.board.is_game_over()) {
      if(this.gamefinished){
        // donothing
      }else{
        console.log("game finished");
        let black,white;
        [black , white] = this.board.get_result();
        console.log("black,white", black, white);
        let message = "";
        if(black == 1){
          message = "black win";
        }else if(white == 1){
          message = "white win";
        }else{
          message = "draw"
        }
        this.show_result(message);
        this.gamefinished = true;
      }
    }
    if (this.board.turn == 1) {
      this.last_turn = 1;
      // 自分の番
    } else if (this.board.turn == -1) {
      // 相手の番
      if (this.last_turn == 1) {
        this.player_turn_finished_time = Math.floor(new Date().getTime() / 1000);
        this.last_turn = -1;
      }
      let current_time = Math.floor(new Date().getTime() / 1000);
      // 2秒待つ
      if (current_time - this.player_turn_finished_time > 1) {
        const valid_actions = this.board.get_valid_actions();
        let action_idx = Math.floor(Math.random() * valid_actions.length);
        let action = valid_actions[action_idx];
        this.board.put_stone(action);
        // 入力を受け付ける
        this.board.ready_put()
        this.player_turn_finished_time = -1;
      }
    }
  },
  show_result: function(message) {
		let result_elements = Result().addChildTo(this)
																	.setPosition(this.gridX.center(),this.gridY.center());
		let rect = RectangleShape({
      width: 300,
      height: 200,
      fill: '#5BA8D9',
      // stroke: 'lime',
      strokeWidth: 0,
      cornerRadius: 0
    }).addChildTo(result_elements);
		rect.alpha = 0.7;
		// ラベル表示
		let label = Label(message).addChildTo(result_elements);
		// label.setPosition(result_elements.gridX.center(), result_elements.gridY.center());
  },
});

/*
 * メイン処理
 */
phina.main(function () {
  // アプリケーションを生成
  var app = GameApp({
    // MainScene から開始
    startLabel: 'main',
    // アセット読み込み
    assets: ASSETS,
  });
  // fps表示
  app.enableStats();
  // 実行
  app.run();
});
