/*
 * Googleマップアプリからエクスポートできるlocation-hisotory.jsonを管理する
 */

import { TimeLine } from './timeline';

class TimeLineJson extends TimeLine {
  /* ファイルを読み込む */
  load(text) {
    const obj = JSON.parse(text);
    const semantics = this.__parseSemantics(obj);
    for (const semantic of semantics) {
      /* 開始・終了時間 */
      const begin = new Date(semantic.startTime);
      const end = new Date(semantic.endTime);
      /* 訪問場所 */
      if (semantic.visit !== undefined) {
        const place_location = semantic.visit.topCandidate.placeLocation;
        const lat_lng = this.__parseLatLng(place_location);
        this.addVisit(begin, end, lat_lng[0], lat_lng[1]);
      }
      /* 移動履歴 */
      else if (semantic.timelinePath != undefined) {
        let points = [];
        for (const path of semantic.timelinePath) {
          const point = path.point;
          const lat_lng = this.__parseLatLng(point);
          points.push({
            latitude: lat_lng[0],
            longitude: lat_lng[1],
          });
        }
        this.addActivity(begin, end, points);
      }
      /* 移動履歴(old style) */
      else if (semantic.activity !== undefined) {
        let points = [];
        const keywords = ['start', 'end'];
        for (const keyword of keywords) {
          const lat_lng = this.__parseLatLng(semantic.activity[keyword]);
          points.push({
            latitude: lat_lng[0],
            longitude: lat_lng[1],
          });
        }
        this.addActivity(begin, end, points, 'old');
      }
    }
  };

  /* 移動履歴を解析する */
  __parseSemantics(obj) {
    let semantics;
    /* iPhone用のデータ書式 */
    if (obj['semanticSegments'] === undefined) {
      semantics = obj;
    }
    /* Android用のデータ書式 */
    else {
      semantics = obj['semanticSegments'];
    }
    return semantics;
  };

  /* 緯度・経度を解析する */
  __parseLatLng(obj) {
    let lat_lng = [0, 0];
    let text;
    if (typeof obj === "string") {
      text = obj;
    }
    else {
      text = obj['latLng'];
    }
    /* iPhone用のデータ書式 */
    if (text.startsWith('geo:')) {
      lat_lng = text.replace('geo:', '').split(',');
    }
    /* Android用のデータ書式 */
    else {
      lat_lng = text.replaceAll('°', '').split(',');
    }
    return lat_lng;
  };

  /* 値を取得するときのフィルター */
  __get_filter(begin, end, arr) {
    let rtn = [];
    for (const value of arr) {
      if (value.time.begin < begin || value.time.end > end) {
        continue;
      }
      rtn.push(value);
    }
    return rtn;
  };
}

export default defineNuxtPlugin((_nuxtApp) => {
  return {
    provide: {
      TimeLineJson,
    }
  }
});
