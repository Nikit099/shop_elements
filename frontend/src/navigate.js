import { Routes, Route, useNavigate } from "react-router-dom";
import { useEffect, useRef } from "react";
import { useMainContext } from "./context";

import FixedButton from "./components/FixedButton";
import Main from "./screens/Main";
import Loading from "./screens/Loading";
import Search from "./screens/Search";
import Add from "./screens/Add";
import Edit from "./screens/Edit";
import Cart from "./screens/Cart";
import Card from "./screens/Card";
// import NotFound from "./screens/NotFound";
import Welcome from "./screens/Welcome";
import BusinessSettings from "./screens/BusinessSettings";

const Navigate = () => {

  const { loading, sendMessage, message, setMessage, socket } = useMainContext();
  const navigate = useNavigate();

  const hasAttemptedSendRef = useRef(false);
const didRouteFromBIdRef = useRef(false); // <-- новый флаг
const didHandleStartParamRef = useRef(false);
function mockTelegram() {

  // if (window.Telegram) return;

  const user = {
    id: 709652754,
    first_name: "Test",
    username: "test_user"
  };

  const initData = 
    "query_id=test_query" +
    "&user=" + encodeURIComponent(JSON.stringify(user)) +
    "&auth_date=1710000000" +
    "&hash=test_hash";

  window.Telegram = {
    WebApp: {
      initData: initData,

      initDataUnsafe: {
        query_id: "test_query",
        user: user,
        auth_date: 1710000000,
        start_param: null
      },

      ready: () => console.log("tg ready"),
      expand: () => {},
      disableVerticalSwipes: () => {}
    }
  };

}

// 1) Однократная инициализация Telegram и навигация по startapp
useEffect(() => {
  if (didHandleStartParamRef.current) return; // уже обработали

  const tg = window.Telegram?.WebApp;

  if (tg) {
    tg.ready();
    tg.expand();
    tg.disableVerticalSwipes();
  }

  let startParam = tg?.initDataUnsafe?.start_param;
  // console.log('startParam effect', { startParam, path: window.location.pathname });

  if (!startParam) {
    const params = new URLSearchParams(window.location.search);
    startParam = params.get("startapp");
  }

  if (startParam && window.location.pathname !== `/${startParam}`) {
    didHandleStartParamRef.current = true;      // запоминаем, что отработали
    navigate(`/${startParam}`, { replace: true });
  } else {
    // даже если startParam нет, помечаем, чтобы не дёргать это ещё раз
    didHandleStartParamRef.current = true;
  }
}, [navigate]);



useEffect(() => {
  const tg = window.Telegram?.WebApp;

  if (window.location.pathname !== "/" || hasAttemptedSendRef.current) return;

  const sendGetBIdMessage = () => {
    if (!loading && socket && !hasAttemptedSendRef.current) {
      hasAttemptedSendRef.current = true;
      sendMessage(
        JSON.stringify([
          "get_bId",
          "get",
          { initData: tg?.initData || null }
        ])
      );
    } else if (!hasAttemptedSendRef.current) {
      setTimeout(sendGetBIdMessage, 100);
    }
  };

  sendGetBIdMessage();
}, [loading, socket, sendMessage]);

  // Обработка websocket сообщений

    useEffect(() => {
      // console.log('message effect', { message, path: window.location.pathname });

  if (!message) return;

  if (message[0] === "get_bId" && message[1] === "result") {
    const bId = message?.[2]?.business_id;

    if (didRouteFromBIdRef.current) { // уже использовали этот ответ для навигации
      setMessage(null);
      return;
    }

    if (bId) {
      didRouteFromBIdRef.current = true;
      if (window.location.pathname !== `/${bId}`) {
        navigate(`/${bId}`);
      }
      setMessage(null);
    } else {
      navigate("/oups");
      setMessage(null);
    }
  }

  if (message[1] === "error") {
    navigate("/oups");
    setMessage(null);
  }
}, [message, navigate, setMessage]);


  return (
    !loading ?
      <div>
        <Routes>

          <Route path="/oups" element={<Welcome />} />

          <Route path="/:bId" element={<Main />} />
          <Route path="/:bId/add" element={<Add />} />
          <Route path="/:bId/cart" element={<Cart />} />
          <Route path="/cart/dash" element={<Cart />} />
          <Route path="/:bId/search" element={<Search />} />
          <Route path="/:bId/card/:id" element={<Card />} />
          <Route path="/:bId/edit/:id" element={<Edit />} />

          <Route path="/:bId/settings" element={<BusinessSettings />} />

        </Routes>

        <FixedButton />
      </div>
      :
      <Loading />
  );
};

export default Navigate;