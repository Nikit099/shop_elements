import styles from './styles/Title.module.css';
import { useState } from 'react';
import { useMainContext } from '../context';

function Title({ text, allowGrid, allowBlocks, allowActions, actions, selected, showMore, canDelete, deleteText, canChangeTitle, choices, selectedChoice, setSelectedChoice }) {
  const { theme } = useMainContext();

  return (
    <div className={styles.title}>
      <div className={styles.text} onClick={() => {
        if (canChangeTitle) {
          document.getElementById(`sort_`).focus();
          document.getElementById(`arrow_`).style.transform = "rotate(270deg)";
        }
      }} style={{ color: theme === "Dark" ? "#dfdfdfff" : "#2d2d2dff" }}>
        {text} 
        {canChangeTitle &&
        <>
          <img id="arrow_" src={require("../components/images/arrow-right.svg").default} alt="arrow right" style={{height: 15, transition: ".2s", filter: theme === "Dark" ? "brightness(1)" : "brightness(0.6)", transform: "rotate(90deg)"}}/>
          <select id="sort_" style={{opacity: 0, width: 0, height: 0, margin: 0, padding: 0}} onChange={(e) => {document.getElementById(`arrow_`).style.transform = "rotate(90deg)";setSelectedChoice(e.target.value)}} onBlur={() => {document.getElementById(`arrow_`).style.transform = "rotate(90deg)"}}>
            {choices.map((choice, index) => (
              <option value={choice} key={index} selected={choice === selectedChoice}>{choice}</option>
            ))}
          </select>
        </>}
        {showMore && 
        <div onClick={showMore} style={{ color: theme === "Dark" ? "#aaa" : "#666" }}>
          Показать всё <img src={require("./images/arrow-right.svg").default} alt="" style={{ filter: theme === "Dark" ? "brightness(1)" : "brightness(0.5)" }} />
        </div>}
      </div>
      <div className={styles.views}>
        {allowGrid &&
          <div className={styles.view} onClick={allowGrid}>
            {selected === "grid" ?
              <img src={require("./images/display1-active.svg").default} alt="" />
            :
              <img src={require("./images/display1.svg").default} alt="" style={{ filter: theme === "Dark" ? "brightness(1)" : "brightness(0.6)" }} />}
          </div>}
        {allowBlocks &&
          <div className={styles.view} onClick={allowBlocks}>
            {selected === "list" ?
              <img src={require("./images/display2-active.svg").default} alt="" />
            :
              <img src={require("./images/display2.svg").default} alt="" style={{ filter: theme === "Dark" ? "brightness(1)" : "brightness(0.6)" }} />}
          </div>}
        {canDelete &&
          <div className={styles.view} onClick={canDelete} style={{display: "flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 300, color: theme === "Dark" ? "#bbb" : "#666", marginRight: -5}}>
              {deleteText ? deleteText : "Очистить всё"}
              <img src={require("./images/remove.svg").default} alt="" style={{ filter: theme === "Dark" ? "brightness(1)" : "brightness(0.6)" }} />
          </div>}
        {allowActions &&
          actions.map((action) => (
            <div className={styles.view} onClick={action.onClick}>
              <img src={action.icon} alt="" style={{ filter: theme === "Dark" ? "brightness(1)" : "brightness(0.6)" }} />
            </div>
          ))}
      </div>
    </div>
  );
}

export default Title;
