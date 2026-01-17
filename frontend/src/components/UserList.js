import styles from './styles/UserList.module.css';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function UserList({ items, businessId }) {

  const navigate = useNavigate();

  return (
    <div className={styles.list}>
      <div className={styles.items}>
        {items.map((user) => (
        <div className={styles.item} key={user._id} onClick={() => navigate(`/${businessId}/users/` + user._id)}>
            <div className={styles.avatar}>
                <img src={user.avatar || require("./images/non-avatar.svg").default} alt="" />
            </div>
            <div>
                <div>{user.username}</div>
                <div>{user.name}</div>
                <div></div>
            </div>
        </div>
        ))}
      </div>
    </div>
  );
}

export default UserList;
