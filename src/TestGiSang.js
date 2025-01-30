import React, { useState, useEffect } from 'react';
// Material-UI 아이콘 컴포넌트 import
import WbSunnyIcon from '@mui/icons-material/WbSunny';      // 맑음 아이콘
import CloudIcon from '@mui/icons-material/Cloud';          // 구름 아이콘
import UmbrellaIcon from '@mui/icons-material/Umbrella';    // 비 아이콘
import AcUnitIcon from '@mui/icons-material/AcUnit';        // 눈 아이콘

function TestGiSang() {
    // 각 산의 날씨 데이터를 저장할 state
    const [mountainsWeather, setMountainsWeather] = useState({});
    
    // 기상청 API 인증키
    const API_KEY = '89iG%2FlEU2PPje9YFfxcr9qq9kg1WgOgvcQY5PHYE5wgmKmZwMwjQbOAXsC%2BBED6zlNuMGOdZnQQFiiGK0HDVqw%3D%3D';
    
    // 산 위치별 격자 좌표 (기상청 제공 좌표계)
    const mountains = {
        설악산: { nx: 87, ny: 141 },
        북한산: { nx: 61, ny: 127 },
        지리산: { nx: 67, ny: 86 },
        한라산: { nx: 52, ny: 38 }
    };

    // 기상청 공식 코드값 정의
    const SKY_CODE = {
        1: '맑음',      // 0-5 구름량
        3: '구름많음',  // 6-8 구름량
        4: '흐림'       // 9-10 구름량
    };

    const PTY_CODE = {
        0: '없음',
        1: '비',
        2: '비/눈',
        3: '눈',
        4: '소나기'
    };

    // 강수량 포맷팅 함수
    const formatRainfall = (rn1) => {
        if (rn1 === 0) return '강수없음';
        if (rn1 < 1.0) return '1mm 미만';
        if (rn1 >= 1.0 && rn1 < 30.0) return `${rn1}mm`;
        if (rn1 >= 30.0 && rn1 < 50.0) return '30~50mm';
        return '50mm 이상';
    };

    // 날씨 상태에 따른 아이콘 반환 함수
    const getWeatherIcon = (sky, pty) => {
        // 강수형태(PTY)가 있는 경우 우선 처리
        if (pty && pty !== '0') {
            switch (pty) {
                case '1':
                    return { 
                        icon: <UmbrellaIcon sx={{ fontSize: 40, color: '#4B89DC' }} />, 
                        text: PTY_CODE[pty]
                    };
                case '2':
                    return { 
                        icon: <UmbrellaIcon sx={{ fontSize: 40, color: '#8C9EFF' }} />, 
                        text: PTY_CODE[pty]
                    };
                case '3':
                    return { 
                        icon: <AcUnitIcon sx={{ fontSize: 40, color: '#8C9EFF' }} />, 
                        text: PTY_CODE[pty]
                    };
                case '4':
                    return { 
                        icon: <UmbrellaIcon sx={{ fontSize: 40, color: '#4B89DC' }} />, 
                        text: PTY_CODE[pty]
                    };
                default:
                    return null;
            }
        }
        
        // 하늘상태(SKY) 처리
        switch (sky) {
            case '1':
                return { 
                    icon: <WbSunnyIcon sx={{ fontSize: 40, color: '#FFB300' }} />, 
                    text: SKY_CODE[sky]
                };
            case '3':
                return { 
                    icon: <CloudIcon sx={{ fontSize: 40, color: '#90A4AE' }} />, 
                    text: SKY_CODE[sky]
                };
            case '4':
                return { 
                    icon: <CloudIcon sx={{ fontSize: 40, color: '#78909C' }} />, 
                    text: SKY_CODE[sky]
                };
            default:
                return { 
                    icon: <WbSunnyIcon sx={{ fontSize: 40, color: '#FFB300' }} />, 
                    text: '맑음'
                };
        }
    };

    useEffect(() => {
        const fetchMountainWeather = async (mountainName, coordinates) => {
            try {
                const now = new Date();
                const year = now.getFullYear();
                const month = String(now.getMonth() + 1).padStart(2, '0');
                const day = String(now.getDate()).padStart(2, '0');
                const hour = now.getHours();
                const baseDate = `${year}${month}${day}`;

                // 발표시간은 0200, 0500, 0800, 1100, 1400, 1700, 2000, 2300
                let baseTime;
                if (hour < 2) {
                    baseTime = "2300";
                    const yesterday = new Date(now);
                    yesterday.setDate(yesterday.getDate() - 1);
                    baseDate = `${yesterday.getFullYear()}${String(yesterday.getMonth() + 1).padStart(2, '0')}${String(yesterday.getDate()).padStart(2, '0')}`;
                } else if (hour < 5) baseTime = "0200";
                else if (hour < 8) baseTime = "0500";
                else if (hour < 11) baseTime = "0800";
                else if (hour < 14) baseTime = "1100";
                else if (hour < 17) baseTime = "1400";
                else if (hour < 20) baseTime = "1700";
                else if (hour < 23) baseTime = "2000";
                else baseTime = "2300";

                // API 요청 시 재시도 로직 추가
                const fetchWithRetry = async (url, retries = 3) => {
                    for (let i = 0; i < retries; i++) {
                        try {
                            const response = await fetch(url);
                            const text = await response.text();
                            if (text.includes('<OpenAPI_ServiceResponse>')) {
                                throw new Error('XML response received');
                            }
                            return JSON.parse(text);
                        } catch (error) {
                            if (i === retries - 1) throw error;
                            await new Promise(resolve => setTimeout(resolve, 1000)); // 1초 대기
                        }
                    }
                };

                const fcstUrl = `https://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getVilageFcst?serviceKey=${API_KEY}&numOfRows=1000&pageNo=1&base_date=${baseDate}&base_time=${baseTime}&nx=${coordinates.nx}&ny=${coordinates.ny}&dataType=JSON`;
                const ncstUrl = `https://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getUltraSrtNcst?serviceKey=${API_KEY}&numOfRows=10&pageNo=1&base_date=${baseDate}&base_time=${String(hour).padStart(2, '0')}00&nx=${coordinates.nx}&ny=${coordinates.ny}&dataType=JSON`;

                console.log('Requesting URLs:', {
                    mountain: mountainName,
                    fcstUrl,
                    ncstUrl
                });

                const [fcstData, ncstData] = await Promise.all([
                    fetchWithRetry(fcstUrl),
                    fetchWithRetry(ncstUrl)
                ]);

                if (fcstData.response.header.resultCode === '00' && 
                    ncstData.response.header.resultCode === '00') {
                    
                    const fcstItems = fcstData.response.body.items.item;
                    const ncstItems = ncstData.response.body.items.item;
                    
                    const weatherInfo = {
                        ...processWeatherData(fcstItems),
                        ...processCurrentWeather(ncstItems)
                    };

                    console.log(`${mountainName} Weather Info:`, weatherInfo);

                    setMountainsWeather(prev => ({
                        ...prev,
                        [mountainName]: weatherInfo
                    }));
                }
            } catch (error) {
                console.error(`${mountainName} 날씨 데이터 가져오기 실패:`, error);
            }
        };

        Object.entries(mountains).forEach(([name, coords]) => {
            fetchMountainWeather(name, coords);
        });
    }, []);

    // API 응답 데이터 처리 함수
    const processWeatherData = (items) => {
        const weatherInfo = {};
        items.forEach(item => {
            switch(item.category) {
                case 'TMX':  // 최고기온
                    weatherInfo.maxTemp = item.fcstValue;
                    break;
                case 'TMN':  // 최저기온
                    weatherInfo.minTemp = item.fcstValue;
                    break;
                case 'POP':  // 강수확률
                    weatherInfo.pop = item.fcstValue;
                    break;
                case 'SKY':  // 하늘상태
                    weatherInfo.sky = item.fcstValue;
                    break;
                case 'PTY':  // 강수형태
                    weatherInfo.pty = item.fcstValue;
                    break;
                case 'RN1':  // 1시간 강수량
                    weatherInfo.rn1 = formatRainfall(parseFloat(item.fcstValue));
                    break;
            }
        });
        return weatherInfo;
    };

    // 현재 날씨 데이터 처리 함수 (추가)
    const processCurrentWeather = (items) => {
        const weatherInfo = {};
        items.forEach(item => {
            switch(item.category) {
                case 'T1H':  // 현재 기온
                    weatherInfo.currentTemp = item.obsrValue;
                    break;
                case 'REH':  // 습도
                    weatherInfo.humidity = item.obsrValue;
                    break;
            }
        });
        return weatherInfo;
    };

    // 스타일 정의
    const styles = {
        container: {
            padding: '20px',
            maxWidth: '800px',
            margin: '0 auto',
            backgroundColor: '#1e1e1e',
            minHeight: '100vh'
        },
        mountainGrid: {
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '20px',
            marginTop: '20px'
        },
        mountainCard: {
            border: 'none',
            borderRadius: '12px',
            padding: '20px',
            backgroundColor: 'white',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        },
        mountainName: {
            color: '#1e1e1e',
            marginBottom: '15px',
            fontSize: '1.5em',
            fontWeight: 'bold',
            textAlign: 'center'
        },
        weatherInfo: {
            margin: '8px 0',
            color: '#1e1e1e',
            fontSize: '1.1em',
            textAlign: 'center'
        },
        weatherIcon: {
            textAlign: 'center',
            margin: '20px 0',
            fontSize: '2.5em'
        }
    };

    // UI 렌더링
    return (
        <div style={styles.container}>
            <div style={styles.mountainGrid}>
                {Object.entries(mountainsWeather).map(([mountainName, weather]) => {
                    const weatherStatus = getWeatherIcon(weather.sky, weather.pty);
                    return (
                        <div key={mountainName} style={styles.mountainCard}>
                            <div style={styles.mountainName}>{mountainName}</div>
                            <div style={styles.weatherIcon}>
                                {weatherStatus?.icon}
                            </div>
                            {weather.currentTemp && (
                                <div style={styles.weatherInfo}>
                                    현재기온: {weather.currentTemp}°C
                                </div>
                            )}
                            {weather.maxTemp && (
                                <div style={styles.weatherInfo}>
                                    최고기온: {weather.maxTemp}°C
                                </div>
                            )}
                            {weather.minTemp && (
                                <div style={styles.weatherInfo}>
                                    최저기온: {weather.minTemp}°C
                                </div>
                            )}
                            <div style={styles.weatherInfo}>
                                강수량: {weather.rn1 || '0mm'}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default TestGiSang;