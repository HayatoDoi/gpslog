/*
 * タイムラインを管理する基底クラス
 */
import { Geodesic } from 'geographiclib-geodesic';

export class TimeLine {
  __visits = []; /* 訪問場所 */
  __activities = []; /* 移動履歴 */

  /* 訪問場所を追加する */
  addVisit(begin, end, latitude, longitude) {
    this.__visits.push({
      time: {
        begin: begin,
        end: end,
      },
      point: {
        latitude: latitude,
        longitude: longitude,
      },
    });
  };

  /* 移動履歴を追加する */
  addActivity(begin, end, points) {
    this.__activities.push({
      time: {
        begin: begin,
        end: end,
      },
      points: points,
    });
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

  /* 訪問場所を取得する */
  getVisits(begin, end) {
    return this.__get_filter(begin, end, this.__visits);
  };

  /* 移動履歴を取得する */
  getActivities(begin, end) {
    return this.__get_filter(begin, end, this.__activities);
  };

  /* 2点間の距離(km)を計算する */
  __calcKm(a, b) {
    const geod = Geodesic.WGS84;
    let _a = [], _b = [];
    _a[0] = parseFloat(a.latitude);
    _a[1] = parseFloat(a.longitude);
    _b[0] = parseFloat(b.latitude);
    _b[1] = parseFloat(b.longitude);
    let r = geod.Inverse(_a[0], _a[1], _b[0], _b[1]);
    return parseFloat(r.s12);
  };

  /* 移動距離を取得する */
  getDistance(begin, end) {
    let distance = 0.0;
    const activities = this.getActivities(begin, end);
    for (const activity of activities) {
      for (let i = 0; i < activity.points.length - 1; i++) {
        const from_lat_lng = activity.points[i];
        const to_lat_lng = activity.points[i+1];
        distance += this.__calcKm(from_lat_lng, to_lat_lng);
      }
    }
    return Math.floor(distance) / 1000; /* m->km変換&小数点の切り捨て */
  };
}

export default defineNuxtPlugin((_nuxtApp) => {
  return {
    provide: {
      TimeLine,
    }
  }
});
