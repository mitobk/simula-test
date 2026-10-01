import { Boot } from './scenes/Boot';
import { GameOver } from './scenes/GameOver';
import { Game as MainGame } from './scenes/Game';
import { MainMenu } from './scenes/MainMenu';
import { AUTO, Game, Scale } from 'phaser';
import { Preloader } from './scenes/Preloader';


export const GAME_WIDTH = 390;
export const GAME_HEIGHT = 844;

const config: Phaser.Types.Core.GameConfig = {
    type: AUTO,
    width: 320,
    height: 568,
    parent: 'game-container',
    backgroundColor: '#028af8',
    scene: [
        Boot,
        Preloader,
        MainMenu,
        MainGame,
        GameOver
    ],
    scale: {
        mode: Scale.FIT,
        autoCenter: Scale.CENTER_BOTH,
        width: GAME_WIDTH,
        height: GAME_HEIGHT,
        // Minimum and maximum display sizes
        min: {
            width: 320,
            height: 568
        },
        max: {
            width: 768,
            height: 1664
        }
  }
};

const StartGame = (parent: string) => {

    return new Game({ ...config, parent });

}

export default StartGame;
