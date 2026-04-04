import styles from './styles/Loading.module.css';

function Loading() {
  return (
    <div className="view">
      <div className={styles.emptyPage}>
        <div className={styles.loading}>
          <div style={{ fontSize: '72px', fontWeight: 'bold', color: '#fff' }}>
            LB
          </div>
        </div>
      </div>
    </div>
  );
}

export default Loading;
