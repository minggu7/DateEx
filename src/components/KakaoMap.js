import React, { useEffect } from 'react';

// �� ������ (���߿� ���� ���Ϸ� �и� ����)
const MOUNTAIN_DATA = {
    '���ǻ�': { 
        lat: 38.119289, 
        lng: 128.465556,
        height: '1,708m',
        description: '�������� ��ǥ���� ��',
        difficulty: '��'
    },
    '���ѻ�': { 
        lat: 37.659976, 
        lng: 126.975892,
        height: '836.5m',
        description: '������ ��ǥ���� ��',
        difficulty: '��'
    },
    '������': { 
        lat: 35.337669, 
        lng: 127.731747,
        height: '1,915m',
        description: '���������� ��ǥ���� ��',
        difficulty: '��'
    },
    '�Ѷ��': { 
        lat: 33.362500, 
        lng: 126.533694,
        height: '1,947m',
        description: '���ֵ��� ��ǥ���� ��',
        difficulty: '�߻�'
    }
};

function KakaoMap() {
    useEffect(() => {
        const initMap = () => {
            const container = document.getElementById('map');
            const options = {
                center: new window.kakao.maps.LatLng(36.5, 127.5), // �ѱ� �߽� ��ǥ
                level: 13 // ���� Ȯ�� ����
            };

            const map = new window.kakao.maps.Map(container, options);

            // ��Ŀ �̹��� ����
            const markerImageSrc = 'https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/markerStar.png';
            const imageSize = new window.kakao.maps.Size(24, 35);
            const markerImage = new window.kakao.maps.MarkerImage(markerImageSrc, imageSize);

            // �� ��Ŀ ����
            Object.entries(MOUNTAIN_DATA).forEach(([name, data]) => {
                const marker = new window.kakao.maps.Marker({
                    map: map,
                    position: new window.kakao.maps.LatLng(data.lat, data.lng),
                    title: name,
                    image: markerImage
                });

                // ���������� ����
                const infoContent = `
                    <div style="padding:10px;width:200px;">
                        <h3 style="margin:0;padding-bottom:5px;border-bottom:1px solid #ddd;">${name}</h3>
                        <p style="margin:5px 0;">����: ${data.height}</p>
                        <p style="margin:5px 0;">���̵�: ${data.difficulty}</p>
                        <p style="margin:5px 0;font-size:12px;">${data.description}</p>
                    </div>
                `;

                const infowindow = new window.kakao.maps.InfoWindow({
                    content: infoContent,
                    removable: true
                });

                // ��Ŀ Ŭ�� �̺�Ʈ
                window.kakao.maps.event.addListener(marker, 'click', function() {
                    infowindow.open(map, marker);
                    map.setCenter(marker.getPosition());
                    map.setLevel(8);
                });

                // ��Ŀ ���콺���� �̺�Ʈ
                window.kakao.maps.event.addListener(marker, 'mouseover', function() {
                    marker.setZIndex(1);
                });
            });
        };

        // īī���� �ε� Ȯ�� �� �ʱ�ȭ
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