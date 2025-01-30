import React, { useEffect } from 'react';

// 산 데이터 (나중에 별도 파일로 분리 가능)
const MOUNTAIN_DATA = {
    '설악산': { 
        lat: 38.119289, 
        lng: 128.465556,
        height: '1,708m',
        description: '강원도의 대표적인 산',
        difficulty: '상'
    },
    '북한산': { 
        lat: 37.659976, 
        lng: 126.975892,
        height: '836.5m',
        description: '서울의 대표적인 산',
        difficulty: '중'
    },
    '지리산': { 
        lat: 35.337669, 
        lng: 127.731747,
        height: '1,915m',
        description: '남부지방의 대표적인 산',
        difficulty: '상'
    },
    '한라산': { 
        lat: 33.362500, 
        lng: 126.533694,
        height: '1,947m',
        description: '제주도의 대표적인 산',
        difficulty: '중상'
    }
};

function KakaoMap() {
    useEffect(() => {
        const initMap = () => {
            const container = document.getElementById('map');
            const options = {
                center: new window.kakao.maps.LatLng(36.5, 127.5), // 한국 중심 좌표
                level: 13 // 지도 확대 레벨
            };

            const map = new window.kakao.maps.Map(container, options);

            // 마커 이미지 설정
            const markerImageSrc = 'https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/markerStar.png';
            const imageSize = new window.kakao.maps.Size(24, 35);
            const markerImage = new window.kakao.maps.MarkerImage(markerImageSrc, imageSize);

            // 산 마커 생성
            Object.entries(MOUNTAIN_DATA).forEach(([name, data]) => {
                const marker = new window.kakao.maps.Marker({
                    map: map,
                    position: new window.kakao.maps.LatLng(data.lat, data.lng),
                    title: name,
                    image: markerImage
                });

                // 인포윈도우 생성
                const infoContent = `
                    <div style="padding:10px;width:200px;">
                        <h3 style="margin:0;padding-bottom:5px;border-bottom:1px solid #ddd;">${name}</h3>
                        <p style="margin:5px 0;">높이: ${data.height}</p>
                        <p style="margin:5px 0;">난이도: ${data.difficulty}</p>
                        <p style="margin:5px 0;font-size:12px;">${data.description}</p>
                    </div>
                `;

                const infowindow = new window.kakao.maps.InfoWindow({
                    content: infoContent,
                    removable: true
                });

                // 마커 클릭 이벤트
                window.kakao.maps.event.addListener(marker, 'click', function() {
                    infowindow.open(map, marker);
                    map.setCenter(marker.getPosition());
                    map.setLevel(8);
                });

                // 마커 마우스오버 이벤트
                window.kakao.maps.event.addListener(marker, 'mouseover', function() {
                    marker.setZIndex(1);
                });
            });
        };

        // 카카오맵 로드 확인 후 초기화
        if (window.kakao && window.kakao.maps) {
            initMap();
        }
    }, []);

    return (
        <div style={{ position: 'relative', width: '100%', height: '100vh' }}>
            <div id="map" style={{ width: '100%', height: '100%' }}></div>
        </div>
    );
}

export default KakaoMap; 