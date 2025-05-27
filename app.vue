<template>
  <div class="map">
    <LMap
      ref="map"
      :options="{ zoomControl: false }"
      :zoom="map.zoom"
      :center="map.center"
      :use-global-leaflet="true"
    >
      <LTileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution="&amp;copy; <a href=&quot;https://github.com/HayatoDoi/gpslog&quot;>HayatoDoi</a>"
      >
      <UIcon name="i-lucide-lightbulb" class="size-5" />
      </LTileLayer>
      <template v-for="marker in map.markers">
        <LMarker :lat-lng="marker" :icon="map.icon" />
      </template>
      <template v-for="line in map.lines">
        <LPolyline :lat-lngs="line" color="green" />
      </template>
    </LMap>
  </div>
  <div class="modal" v-if="this.page.modal === 'upload'">
    <div class="modal-contents">
      <div class="modal-header">
        <p>ファイルのアップロード</p>
        <UButton class="modal-close" icon="material-symbols:close-rounded"
         size="lg" color="neutral" variant="outline" @click="this.page.modal = ''"/>
      </div>
      <div class="modal-body">
        <p>iPhoneのGoogle Mapアプリ、または、Androidの設定アプリからダウンロードしたjsonファイルをアップロードしてください。</p>
        <p>jsonファイルのダウンロード方法は <a href="">こちら</a> 。</p>
        <UButton class="file-upload-erea" icon="fluent-mdl2:attach"
        color="neutral" variant="outline" @click="upload">アップロード</UButton>
        <input id="file-input" type="file" hidden accept=".json" multiple @change="import_data">
      </div>
    </div>
  </div>
  <div class="left-menu">
    <div class="zoom-bottom">
      <UButton color="neutral" size="xl" variant="subtle"
      icon="material-symbols:add"
      @click="map.zoom++" />
      <br>
      <UButton color="neutral" size="xl" variant="subtle"
      icon="material-symbols:remove"
      @click="map.zoom--" />
    </div>
  </div>
  <div class="bottom-menu">
    <p>{{ this.distance }}km</p>
    <UButton color="neutral" size="lg" variant="subtle"
     icon="material-symbols:keyboard-double-arrow-left"
     @click="time_rewind('-month')" />
    <UButton color="neutral" size="lg" variant="subtle"
     icon="material-symbols:chevron-left"
     @click="time_rewind('-day')" />
    <UPopover>
      <UButton color="neutral" size="lg" variant="subtle" icon="i-lucide-calendar">
        <template v-if="isOneDay()">
          {{ calendar.start.toString().replaceAll('-', '/') }}
        </template>
        <template v-else>
          {{ calendar.start.toString().replaceAll('-', '/') }}
          -
          {{ calendar.end.toString().replaceAll('-', '/') }}
        </template>
      </UButton>
      <template #content>
        <UCalendar size="xl" v-model="calendar" class="p-2" range
         @update:model-value="update_map">
          <template #day="{ day }">
            <UChip :show="!!getCalenderChip(day)" color="success" :size="getCalenderChip(day)">
            {{ day.day }}
            </UChip>
          </template>
         </UCalendar>
      </template>
    </UPopover>
    <UButton color="neutral" size="lg" variant="subtle"
     icon="material-symbols:chevron-right"
     @click="time_rewind('+day')" />
    <UButton color="neutral" size="lg" variant="subtle"
     icon="material-symbols:keyboard-double-arrow-right"
     @click="time_rewind('+month')" />
  </div>
</template>
<style>
  * {
    touch-action: manipulation;
  }

  body,
  html,
  #__nuxt,
  #__layout,
  .map,
  .modal {
    width: 100%;
    height: 100%;
  }

  .map {
    position: absolute;
    z-index: 50;
  }

  .modal {
    position: absolute;
    z-index: 100;
    background-color: rgba(0, 0, 0, 0.6);
  }

  .modal .modal-contents {
    position: absolute;
    z-index: 110;
    text-align: center;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    margin: auto;
    background-color: white;
    width: 80%;
    height: 50%;
    border-radius: 10px;
  }

  .modal .modal-contents .modal-header {
    /* height: 10%; */
    padding-top: 40px;
    padding-left: 5%;
    padding-right: 5%;
    display: flow-root;
  }

  .modal .modal-contents .modal-header p {
    float: left;
    text-align: left;
  }

  .modal .modal-contents .modal-header .modal-close {
    text-align: right;
    float: right;
  }

  .modal .modal-contents .modal-body {
    text-align: left;
    padding-top: 20px;
    padding-left: 5%;
    padding-right: 5%;
  }

  .file-upload-erea {
    text-align: center;
    width: 100%;
    margin-top: 10px;
    height: 100px;
    border: 2px dashed #00C16A;
    border-radius: 10px;

  }

  .file-upload-erea:hover {
    background-color: #b3f5d132;
    border: 2px dashed #016538;
  }

  .left-menu {
    position: absolute;
    z-index: 90;
    left: 0;
    right: 0;
    margin: 15px;
    margin-top: 30px;
  }

  .bottom-menu {
    position: absolute;
    text-align: center;
    width: 100%;
    z-index: 90;
    top: 100%;
    left: 0;
    right: 0;
    height: 80px;
    transform: translateY(-110%);
  }
</style>
<script>
  import L from 'leaflet';
  import { CalendarDate } from '@internationalized/date';
  const DEFINES = {
    TOKYO_STATION: [35.68114, 139.767061],
    DEFAULT_ZOOM: 6,
    TODAY: {
      YEAR: new Date().getFullYear(),
      MONTH: new Date().getMonth() + 1,
      DAY: new Date().getDate(),
    },
  };
  export default {
    data() {
      return {
        page: {
          modal: 'upload',
        },
        calendar: {
          start: new CalendarDate(
            DEFINES.TODAY.YEAR, DEFINES.TODAY.MONTH, DEFINES.TODAY.DAY),
          end: new CalendarDate(
            DEFINES.TODAY.YEAR, DEFINES.TODAY.MONTH, DEFINES.TODAY.DAY),
        },
        map: {
          markers: [],
          lines: [],
          center: DEFINES.TOKYO_STATION,
          icon: L.icon({
            iconUrl: 'icon.png',
            iconSize: [5, 5],
          }),
          zoom: DEFINES.DEFAULT_ZOOM,
        },
        distance: 0.0,
        timeoutID: {
          zoom: -1,
        },
        raw_data: new this.$TimeLineJson(),
      }
    },
    methods: {
      /* カレンダー上に表示するチップサイズを計算する関数 */
      getCalenderChip(calendar_date) {
        const begin = calendar_date.toDate();
        let end = calendar_date.toDate();
        end.setDate(end.getDate() + 1);
        end.setSeconds(end.getSeconds() - 1);
        const distance = this.raw_data.getDistance(begin, end);
        if (distance < 1.0) {
          return undefined;
        }
        if (distance < 10.0) {
          return '3xs';
        }
        if (distance < 50.0) {
          return '2xs';
        }
        return 'xs';
      },
      /* アップロードボタンが押されたときに呼び出される関数 */
      upload() {
        /* input要素を強制発火させる */
        const elem = document.getElementById('file-input');
        elem.click();
      },
      /* ファイルのアップロード時に呼び出される関数 */
      async import_data(e) {
        this.raw_data = new this.$TimeLineJson();
        const files = e.target.files;
        for (const file of files) {
          const text = await file.text();
          this.raw_data.load(text);
        }
        const current_date = this.raw_data.getMaxDate();
        const year = current_date.getFullYear();
        const month = current_date.getMonth() + 1;
        const day = current_date.getDate();
        this.calendar.end = this.calendar.start =
          new CalendarDate(year, month, day);
        this.update_map();
        this.page.modal = '';
      },
      /* 選択された日付が一日か否か */
      isOneDay() {
        return this.calendar.start.compare(this.calendar.end) === 0;
      },
      /* 日付送り・戻しボタンを押したときに呼び出される関数 */
      time_rewind(type) {
        switch (type) {
          case '-month':
            this.calendar.start =
              this.calendar.start.subtract({months: 1});
            this.calendar.end =
              this.calendar.end.subtract({months: 1});
            break;
          case '-day':
            this.calendar.start =
              this.calendar.start.subtract({days: 1});
            this.calendar.end =
              this.calendar.end.subtract({days: 1});
            break;
          case '+day':
            this.calendar.start =
              this.calendar.start.add({days: 1});
            this.calendar.end =
              this.calendar.end.add({days: 1});
            break;
          case '+month':
            this.calendar.start =
              this.calendar.start.add({months: 1});
            this.calendar.end =
              this.calendar.end.add({months: 1});
            break;
        }
        this.update_map();
      },
      update_map() {
        /* 日付の計算 */
        const begin = this.calendar.start.toDate();
        let end = this.calendar.end.toDate();
        end.setDate(end.getDate() + 1);
        end.setSeconds(end.getSeconds() - 1);
        /* 距離の更新 */
        this.distance = this.raw_data.getDistance(begin, end);
        /* マーカーの更新 */
        this.map.markers = [];
        const visits = this.raw_data.getVisits(begin, end);
        for (const visit of visits) {
          this.map.markers.push([
            visit.point.latitude,
            visit.point.longitude
          ]);
        }
        /* ラインの更新 */
        this.map.lines = [];
        const activities = this.raw_data.getActivities(begin, end);
        for (const activitiy of activities) {
          let line = [];
          for (const point of activitiy.points) {
            line.push([
              point.latitude,
              point.longitude
            ]);
          }
          this.map.lines.push(line);
        }
        /* 中心点とズームレベルを更新 */
        let latitudes = [];
        let longitudes = [];
        for (const lat_lng of this.map.markers) {
          latitudes.push(parseFloat(lat_lng[0]));
          longitudes.push(parseFloat(lat_lng[1]));
        };
        for (const line of this.map.lines) {
          for (const lat_lng of line) {
            latitudes.push(parseFloat(lat_lng[0]));
            longitudes.push(parseFloat(lat_lng[1]));
          }
        };
        if (latitudes.length === 0 || longitudes.length === 0) {
          this.map.center = DEFINES.TOKYO_STATION;
          this.map.zoom = DEFINES.DEFAULT_ZOOM;
          return;
        }
        let north = latitudes[0], south = latitudes[0];
        let east = longitudes[0], west = longitudes[0];
        for (const latitude of latitudes) {
          north = latitude > north ? latitude : north;
          south = latitude < south ? latitude : south;
        }
        for (const longitude of longitudes) {
          east = longitude > east ? longitude : east;
          west = longitude < west ? longitude : west;
        }
        this.map.center = [(north + south) / 2, (east + west) / 2];
        let zoomX = 1;
        const distanceX = (east - west) * (500 / window.innerWidth);
        for (zoomX = 1; distanceX < (180 / (2 ** zoomX)); zoomX++);
        let zoomY = 1;
        const distanceY = (north - south) * (500 / window.innerHeight);
        for (zoomY = 1; distanceY < (180 / (2 ** zoomY)); zoomY++);
        /* 中心点の更新を実行してからすぐにズームレベルを更新すると、
         * 中心点がずれるため、時間を250msec空けてからズームレベルを更新する */
        if (this.timeoutID.zoom !== -1) {
          clearTimeout(this.timeoutID.zoom);
        }
        this.timeoutID.zoom = setTimeout((zoom) => {
          this.map.zoom = zoom;
        }, 250, zoomX < zoomY ? zoomX : zoomY);
      },
    }
  }
</script>
