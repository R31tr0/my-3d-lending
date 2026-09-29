# my-3d-lending
  в разработке =
  PoC Proof of Concept

Страница-визитка с интерактивными 3D-моделями на **React Three Fiber**.

Главный фокус проекта — выразительная 3D-сцена в браузере: модели, свет, камера и плавные анимации интерфейса поверх канваса.

![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-8-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![Three.js](https://img.shields.io/badge/three.js-0.186-000000?style=for-the-badge&logo=threedotjs&logoColor=white)
![React Three Fiber](https://img.shields.io/badge/React_Three_Fiber-9-000000?style=for-the-badge&logo=react&logoColor=white)
![Drei](https://img.shields.io/badge/Drei-10-FF6F00?style=for-the-badge)
![Framer Motion](https://img.shields.io/badge/Framer_Motion-13-0055FF?style=for-the-badge&logo=framer&logoColor=white)
![Lucide](https://img.shields.io/badge/Lucide_React-1.x-F56565?style=for-the-badge&logo=lucide&logoColor=white)
![ESLint](https://img.shields.io/badge/ESLint-10-4B32C3?style=for-the-badge&logo=eslint&logoColor=white)
![Blender](https://img.shields.io/badge/Blender-3D_модели-E87D0D?style=for-the-badge&logo=blender&logoColor=white)

---

## О проекте


- интерактивная 3D-сцена на `@react-three/fiber`;
- готовые хелперы и контролы из `@react-three/drei`;
- анимации интерфейса на `framer-motion`;
- иконки из `lucide-react`;
- быстрая сборка и HMR на Vite.

## Стек

### Фронтенд

| Технология | Версия | Назначение |
| --- | --- | --- |
| React | ^19.2 | UI |
| Vite | ^8.3 | Сборка и dev-сервер |
| three | ^0.186 | 3D-движок |
| @react-three/fiber | ^9.7 | React-рендерер для three.js |
| @react-three/drei | ^10.7 | Хелперы: загрузка моделей, камера, окружение |
| framer-motion | ^13.4 | Анимации интерфейса |
| lucide-react | ^1.47 | Иконки |
| ESLint | ^10.10 | Линтинг |

### 3D-модели

| Инструмент | Назначение |
| --- | --- |
| Blender | Моделирование, материалы, настройка сцены |
| glTF / GLB | Формат экспорта для веба |

Модели создаёт отдельный участник  (см. раздел Contributor ). Готовые файлы экспортируются из Blender в `.glb` и кладутся в `public/models`.

## Быстрый старт

```bash
# клонирование репо
git clone https://github.com/R31tr0/my-3d-lending

#зайти в папку проекта 
cd my-3d-lending

# установка зависимостей
npm install

# запуск dev-сервера
npm run dev


# проверка кода линтером (по желанию)
npm run lint
```

## 3D-модели

Все 3D-модели лежат в папке **`public/models`**.

```
public/
└── models/
    ├── model-name.glb
    └── ...
```

Файлы из `public/` отдаются как статика, поэтому в коде модель подключается по абсолютному пути от корня сайта:

```jsx
import { useGLTF } from '@react-three/drei'

function Model() {
  const { scene } = useGLTF('/models/model-name.glb')
  return <primitive object={scene} />
}
```


## Contributor 

| Участник | Роль | Инструменты |
| --- | --- | --- |
| [@Aestheteq](https://github.com/Aestheteq) | 3D-моделирование | Blender, glTF / GLB, текстурирование |



## Структура проекта



```
my-lending/
├── public/
│   └── models/        # 3D-модели (.glb / .gltf)
├── src/
│   ├── components/   # компоненты 
│   ├── assets/ #ассеты
│   ├── canvas/ # 3д сцена
│   ├── fonts/ #шрифт
│   ├── App.jsx
│   └── main.jsx
└── ... 
```

## Лицензия

Код проекта распространяется под лицензией MIT.
код можно свободно копировать и использовать в своих целях 

3D-модели из public/models созданы отдельным автором . Их можно смотреть и изучать в рамках этого репозитория, а для использования в других проектах нужно согласие автора.
