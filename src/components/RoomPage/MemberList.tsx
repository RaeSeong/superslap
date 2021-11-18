import Button from "../common/Button";
import styles from "./MemberList.module.scss";

const MemberList = () => {
  return (
    <div className={styles.MemberListContainer}>
      <div className={styles.memberContainer}>
        <div className={styles.memberCount}>
          <div>플레이어 : N명</div>
          <div className={styles.roomNumber}>방 번호 : AC3DF1</div>
        </div>
        <div className={styles.memberList}>
          <ul>
            <li>플레이어 1: 김아무개</li>
            <li>플레이어 1: 김아무개</li>
            <li>플레이어 1: 김아무개</li>
            <li>플레이어 1: 김아무개</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default MemberList;