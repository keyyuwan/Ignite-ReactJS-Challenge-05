import styles from './header.module.scss';

export default function Header() {
  return (
    <header className={styles.header}>
      <img src="/Logo.svg" alt="logo" />
    </header>
  );
}
