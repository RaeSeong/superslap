import { GameType } from "../../constants/game";
import styles from "./GameList.module.scss";

const GameLists = Object.values(GameType).filter(
  (value) => value !== GameType.None
);

const GameName: Record<GameType, string> = {
  [GameType.None]: "없음",
  [GameType.Bomb]: "폭탄",
  [GameType.LeftRight]: "좌우좌우",
};

type TGameListProps = {
  onClickGame: (type: GameType) => void;
};

const GameList = ({ onClickGame }: TGameListProps) => {
  return (
    <div className={styles.GameListContainer}>
      <div className={styles.gameContainer}>
        <div className={styles.gameListTitle}>
          <div>게임 리스트</div>
        </div>
        <div className={styles.gameList}>
          <ul>
            {GameLists.map((value, index) => {
              return (
                <li>
                  게임 {index}: {GameName[value]}
                  <button onClick={() => onClickGame(value)}>
                    {GameName[value]}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default GameList;
