import './HeroOverlay.css';

export default function HeroOverlay({ isVisible }) {
  return (
    <section
      className={`hero-overlay${isVisible ? '' : ' hero-overlay--leaving'}`}
      aria-label="Приветствие"
      aria-hidden={!isVisible}
    >
      <div className="hero-intro">
        
        <h1 className="hero-title">
          <span className="hero-greeting">Привет, я</span>
          <span className="hero-name">Илья</span>
        </h1>
        <p className="hero-role">Фронтенд-разработчик</p>
        <p className="hero-description">Создаю выразительные интерфейсы<br />и интерактивные 3D-сцены.</p>
      </div>
    </section>
  );
}