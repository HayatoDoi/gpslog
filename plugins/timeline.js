/*
 * タイムラインを管理する基底クラス
 */
import { Geodesic } from 'geographiclib-geodesic';

class DataList {
  __list = {};

  /* リストに値を追加する */
  push(begin, end, data) {
    const year = String(begin.getFullYear());
    const month = String(begin.getMonth() + 1);
    const date = String(begin.getDate());
    if (this.__list[year] === undefined) {
      this.__list[year] = {};
    }
    if (this.__list[year][month] === undefined) {
      this.__list[year][month] = {};
    }
    if (this.__list[year][month][date] === undefined) {
      this.__list[year][month][date] = [];
    }
    data['time'] = {
      begin: begin,
      end: end,
    };
    this.__list[year][month][date].push(data);
  };

  /* リストから値を取り出す */
  getData(begin, end) {
    let rtn = [];
    const b_year = begin.getFullYear();
    const b_month = begin.getMonth() + 1;
    const b_date = begin.getDate();
    const e_year = end.getFullYear();
    const e_month = end.getMonth() + 1;
    const e_date = end.getDate();
    for (let year = b_year; year <= e_year; year++) {
      if (this.__list[String(year)]
          === undefined) {
        continue;
      }
      for (let month = b_month; month <= e_month; month++) {
        if (this.__list[String(year)][String(month)]
            === undefined) {
          continue;
        }
        for (let date = b_date; date <= e_date; date++) {
          if (this.__list[String(year)][String(month)][String(date)]
              === undefined) {
            continue;
          }
          let values = 
            this.__list[String(year)][String(month)][String(date)];
          for (let i = 0; i < values.length; i++) {
            const value = values[i];
            if (value.time.begin < begin || value.time.end > end) {
              continue;
            }
            rtn.push(value);
          }
        }
      }
    }
    return rtn;
  };
}

export class TimeLine {
  __visits = new DataList(); /* 訪問場所 */
  __activities = new DataList(); /* 移動履歴 */
  __min_time = null;
  __max_time = null;

  /* タイムライン日時の最大・最小を更新する */
  __updateMinMaxTime(begin, end) {
    if (this.__min_time === null || begin < this.__min_time) {
      this.__min_time = begin;
    }
    if (this.__max_time === null || end > this.__max_time) {
      this.__max_time = end;
    }
  };

  /* 訪問場所を追加する */
  addVisit(begin, end, latitude, longitude) {
    this.__updateMinMaxTime(begin, end);
    this.__visits.push(begin, end,{
      point: {
        latitude: latitude,
        longitude: longitude,
      }
    });
  };

  /* 2点間の距離(メートル)を計算する */
  __calcDistance(a, b) {
    const geod = Geodesic.WGS84;
    let _a = [], _b = [];
    _a[0] = parseFloat(a.latitude);
    _a[1] = parseFloat(a.longitude);
    _b[0] = parseFloat(b.latitude);
    _b[1] = parseFloat(b.longitude);
    let r = geod.Inverse(_a[0], _a[1], _b[0], _b[1]);
    return parseFloat(r.s12);
  };

  /* 移動履歴を追加する */
  addActivity(begin, end, points) {
    this.__updateMinMaxTime(begin, end);
    let distance = 0.0;
    for (let i = 0; i < points.length - 1; i++) {
      const from_lat_lng = points[i];
      const to_lat_lng = points[i+1];
      distance += this.__calcDistance(from_lat_lng, to_lat_lng);
    }
    this.__activities.push(begin, end, {
      points: points,
      distance: distance,
    });
  };

  /* 訪問場所を取得する */
  getVisits(begin, end) {
    return this.__visits.getData(begin, end);
  };

  /* 移動履歴を取得する */
  getActivities(begin, end) {
    return this.__activities.getData(begin, end);
  };

  /* 最小日時を取得する */
  getMinDate() {
    return this.__min_time;
  };

  /* 最大日時を取得する */
  getMaxDate() {
    return this.__max_time;
  };

  /* 移動距離を取得する */
  getDistance(begin, end) {
    let distance = 0.0;
    const activities = this.getActivities(begin, end);
    for (const activity of activities) {
      distance += activity.distance;
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
