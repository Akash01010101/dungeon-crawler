import { Game } from './core/Game.js';

window.onload = () => {
    const btnNewGame = document.getElementById('btn-new-game');
    const btnLoadGame = document.getElementById('btn-load-game');
    const mainMenu = document.getElementById('main-menu');
    const gameUi = document.getElementById('game-ui');
    const errorMsg = document.getElementById('load-error');

    let game = null;

    btnNewGame.addEventListener('click', async () => {
        mainMenu.style.display = 'none';
        gameUi.style.display = 'block';
        game = new Game();
        await game.init();
    });

    btnLoadGame.addEventListener('click', async () => {
        const savedData = localStorage.getItem('wasteland_save');
        if (savedData) {
            mainMenu.style.display = 'none';
            gameUi.style.display = 'block';
            game = new Game();
            await game.init();
            game.loadGame(JSON.parse(savedData));
        } else {
            errorMsg.style.display = 'block';
        }
    });
};
