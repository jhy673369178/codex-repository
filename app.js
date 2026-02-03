const { createApp, onMounted, ref } = Vue;

const GRID_COUNT = 20;
const CELL_SIZE = 24;
const INITIAL_SPEED = 140;

createApp({
  setup() {
    const board = ref(null);
    const score = ref(0);
    const bestScore = ref(0);
    const isRunning = ref(false);
    const isOver = ref(false);
    const speed = ref(INITIAL_SPEED);
    const direction = ref({ x: 1, y: 0 });
    const nextDirection = ref({ x: 1, y: 0 });
    const snake = ref([
      { x: 8, y: 10 },
      { x: 7, y: 10 },
      { x: 6, y: 10 },
    ]);
    const food = ref({ x: 12, y: 10 });
    let timer = null;

    const boardSize = GRID_COUNT * CELL_SIZE;

    const speedLabel = Vue.computed(() => {
      if (speed.value < 110) return "快";
      if (speed.value < 150) return "中";
      return "慢";
    });

    const drawBoard = () => {
      const canvas = board.value;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, boardSize, boardSize);

      ctx.fillStyle = "#0f172a";
      ctx.fillRect(0, 0, boardSize, boardSize);

      ctx.strokeStyle = "rgba(148, 163, 184, 0.12)";
      for (let i = 0; i <= GRID_COUNT; i += 1) {
        ctx.beginPath();
        ctx.moveTo(i * CELL_SIZE, 0);
        ctx.lineTo(i * CELL_SIZE, boardSize);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(0, i * CELL_SIZE);
        ctx.lineTo(boardSize, i * CELL_SIZE);
        ctx.stroke();
      }

      snake.value.forEach((segment, index) => {
        ctx.fillStyle = index === 0 ? "#22c55e" : "#4ade80";
        ctx.fillRect(
          segment.x * CELL_SIZE + 2,
          segment.y * CELL_SIZE + 2,
          CELL_SIZE - 4,
          CELL_SIZE - 4
        );
      });

      ctx.fillStyle = "#f97316";
      ctx.beginPath();
      ctx.arc(
        food.value.x * CELL_SIZE + CELL_SIZE / 2,
        food.value.y * CELL_SIZE + CELL_SIZE / 2,
        CELL_SIZE / 2.6,
        0,
        Math.PI * 2
      );
      ctx.fill();

      if (!isRunning.value && isOver.value) {
        ctx.fillStyle = "rgba(15, 23, 42, 0.7)";
        ctx.fillRect(0, 0, boardSize, boardSize);
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 26px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("游戏结束", boardSize / 2, boardSize / 2 - 8);
        ctx.font = "16px sans-serif";
        ctx.fillText("点击重新开始", boardSize / 2, boardSize / 2 + 20);
      }
    };

    const placeFood = () => {
      let newFood = null;
      while (!newFood || snake.value.some((segment) => segment.x === newFood.x && segment.y === newFood.y)) {
        newFood = {
          x: Math.floor(Math.random() * GRID_COUNT),
          y: Math.floor(Math.random() * GRID_COUNT),
        };
      }
      food.value = newFood;
    };

    const update = () => {
      const current = snake.value[0];
      direction.value = { ...nextDirection.value };
      const next = {
        x: current.x + direction.value.x,
        y: current.y + direction.value.y,
      };

      const hitWall =
        next.x < 0 || next.x >= GRID_COUNT || next.y < 0 || next.y >= GRID_COUNT;
      const hitSelf = snake.value.some((segment) => segment.x === next.x && segment.y === next.y);

      if (hitWall || hitSelf) {
        gameOver();
        return;
      }

      snake.value = [next, ...snake.value];

      if (next.x === food.value.x && next.y === food.value.y) {
        score.value += 10;
        if (score.value > bestScore.value) {
          bestScore.value = score.value;
        }
        if (score.value % 50 === 0 && speed.value > 80) {
          speed.value -= 10;
          restartTimer();
        }
        placeFood();
      } else {
        snake.value.pop();
      }

      drawBoard();
    };

    const startGame = () => {
      if (isRunning.value) return;
      isRunning.value = true;
      isOver.value = false;
      restartTimer();
      board.value?.focus();
    };

    const pauseGame = () => {
      isRunning.value = false;
      clearInterval(timer);
      timer = null;
    };

    const toggleGame = () => {
      if (isRunning.value) {
        pauseGame();
        return;
      }
      if (isOver.value) {
        resetGame();
      }
      startGame();
    };

    const resetGame = () => {
      pauseGame();
      score.value = 0;
      speed.value = INITIAL_SPEED;
      direction.value = { x: 1, y: 0 };
      nextDirection.value = { x: 1, y: 0 };
      snake.value = [
        { x: 8, y: 10 },
        { x: 7, y: 10 },
        { x: 6, y: 10 },
      ];
      placeFood();
      isOver.value = false;
      drawBoard();
    };

    const gameOver = () => {
      pauseGame();
      isOver.value = true;
      drawBoard();
    };

    const restartTimer = () => {
      clearInterval(timer);
      timer = setInterval(update, speed.value);
    };

    const handleKey = (event) => {
      const key = event.key.toLowerCase();
      const current = direction.value;
      const isHorizontal = current.x !== 0;
      const isVertical = current.y !== 0;

      const moves = {
        arrowup: { x: 0, y: -1 },
        w: { x: 0, y: -1 },
        arrowdown: { x: 0, y: 1 },
        s: { x: 0, y: 1 },
        arrowleft: { x: -1, y: 0 },
        a: { x: -1, y: 0 },
        arrowright: { x: 1, y: 0 },
        d: { x: 1, y: 0 },
      };

      const nextMove = moves[key];
      if (!nextMove) return;

      if (isHorizontal && nextMove.x !== 0) return;
      if (isVertical && nextMove.y !== 0) return;

      nextDirection.value = nextMove;
    };

    onMounted(() => {
      const storedBest = Number(localStorage.getItem("snake-best"));
      if (!Number.isNaN(storedBest)) {
        bestScore.value = storedBest;
      }
      drawBoard();
    });

    Vue.watch(bestScore, (value) => {
      localStorage.setItem("snake-best", String(value));
    });

    return {
      board,
      boardSize,
      score,
      bestScore,
      isRunning,
      isOver,
      speedLabel,
      toggleGame,
      resetGame,
      handleKey,
    };
  },
}).mount("#app");
