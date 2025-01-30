import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { useEffect } from 'react';
import TestGiSang from './TestGiSang';
import Calendar from './components/Calendar';
import './App.css';

function App() {
  //스크립트 파일 읽어오기
  const new_script = src => { 
    return new Promise((resolve, reject) => { 
      const script = document.createElement('script'); 
      script.src = src; 
      script.addEventListener('load', () => { 
        resolve(); 
      }); 
      script.addEventListener('error', e => { 
        reject(e); 
      }); 
      document.head.appendChild(script); 
    }); 
  };
  useEffect(() => { 
    //카카오맵 스크립트 읽어오기
    const my_script = new_script('https://dapi.kakao.com/v2/maps/sdk.js?autoload=false&appkey=550770fa304faa4bc3ead92f0b1038d9');
    
    //스크립트 읽기 완료 후 카카오맵 설정
    my_script.then(() => { 
      console.log('script loaded!!!');  
      const kakao = window['kakao']; 
      kakao.maps.load(() => {
        const mapContainer = document.getElementById('map');
        const options = { 
          center: new kakao.maps.LatLng(37.56000302825312, 126.97540593203321), //좌표설정
          level: 3 
        }; 
        const map = new kakao.maps.Map(mapContainer, options); //맵생성
        //마커설정
        const markerPosition = new kakao.maps.LatLng(37.56000302825312, 126.97540593203321); 
        const marker = new kakao.maps.Marker({ 
          position: markerPosition
        }); 
        marker.setMap(map); 
      });   
    }); 
  }, []);
  return (
    <Router>
      <div className="App">
        <div className="App-header">
          <div className="button-container">
            <Link to="/weather">
              <button className="weather-button">
                테스트페이지 기상청 API
              </button>
            </Link>
            <Link to="/calendar">
              <button className="weather-button">
                달력 테스트
              </button>
            </Link>
          </div>

          <Routes>
            <Route path="/weather" element={<TestGiSang />} />
            <Route path="/calendar" element={
              <div className="calendar-container">
                <Calendar />
              </div>
            } />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
