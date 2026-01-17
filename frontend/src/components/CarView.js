import styles from './styles/CarView.module.css';
import { useState, useRef, useEffect } from 'react';
import { Stage, Layer, Shape } from 'react-konva';
import { useNavigate } from 'react-router-dom';

const width = window.innerWidth - 20;
const height = (window.innerWidth - 27.1) * 410 / 564;

function CarView({ onlyView, carId, damages, businessId}) {
  const navigate = useNavigate();

  const shapeRef = useRef(null);

  const [colors, setColors] = useState({ 'крыша': '#FFFFFF' });

  const handleShapeClick = (e, type) => {
    const shape = shapeRef.current;
    e.cancelBubble = true;

    if (!onlyView) {
      let go = `/add-damage?type=${type}&carId=${carId}`;
      damages.forEach(damage => {
        if (damage.type === type) {
          go = `/edit-damage?id=${damage._id}&type=${damage.type}`;
        };
      })
      navigate(`/${businessId}` + go);
    };

  };

  useEffect(() => {
    if (damages.length > 0) {
      damages.forEach(damage => {
        if (damage.type === 'крыша') {
          setColors((prevState) => ({
            ...prevState,
            [damage.type]: "red"
          }));
        }
      });
    } else {
      setColors({ 'крыша': '#FFFFFF' })
    };
  }, [damages])

  return (
    <div className={styles.act}>
      <img src={require("./images/act-image.png")} alt="act image" />
      <div style={{ position: 'absolute', top: 0, left: 0, zIndex: 1 }}>
        <Stage width={width} height={height}>
          <Layer>
            <Shape
              ref={shapeRef}
              sceneFunc={(context, shape) => {
                context.beginPath();
                context.moveTo(width / 2.22, height / 2.51);
                context.quadraticCurveTo(width / 1.81, height / 2.43, width / 1.64, height / 2.5);
                context.quadraticCurveTo(width / 1.59, height / 2, width / 1.64, height / 1.72);
                context.quadraticCurveTo(width / 1.81, height / 1.75, width / 2.22, height / 1.702);
                context.quadraticCurveTo(width / 2.29, height / 2, width / 2.22, height / 2.51);
                context.closePath();
                context.fillStrokeShape(shape);
              }}
              fill={colors['крыша']}
              stroke="#111"
              strokeWidth={1}
              lineJoin="round"
              opacity={1}
              listening={true}
              onClick={(e) => handleShapeClick(e, 'крыша')}
              onTap={(e) => handleShapeClick(e, 'крыша')}
            />
          </Layer>
        </Stage>
      </div>
    </div>
  );
}

export default CarView;
