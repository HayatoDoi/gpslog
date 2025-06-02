/*
 * タイムラインを管理する基底クラス
 */
import { Geodesic } from 'geographiclib-geodesic';

class DataList {
  __list = {};

  /* リスト用のインデックスを返す */
  __getListIndex(date) {
    const y = String(date.getFullYear());
    const m = String(date.getMonth() + 1);
    const d = String(date.getDate());
    return [y, m, d];
  }

  /* リスト内に空配列を作成する */
  __createEmptyList(y, m, d) {
    if (this.__list[y] === undefined) {
      this.__list[y] = {};
    }
    if (this.__list[y][m] === undefined) {
      this.__list[y][m] = {};
    }
    if (this.__list[y][m][d] === undefined) {
      this.__list[y][m][d] = [];
    }
  }

  /* リストを1つ1つ処理する */
  listLoop(func, l=this.__list) {
    for (const y of Object.keys(l)) {
      for (const m of Object.keys(l[y])) {
        for (const d of Object.keys(l[y][m])) {
          for (const value of l[y][m][d]) {
            func(value, y, m, d);
          }
        }
      }
    }
  }

  /* リストにリストを結合する */
  concat(data_list) {
    const arg_list = data_list?.__list;
    if (arg_list === undefined) {
      return;
    }
    this.listLoop((value, y, m, d) => {
      this.__createEmptyList(y, m, d);
      this.__list[y][m][d].push(value);
    }, arg_list);
  }

  /* リストに値を追加する */
  push(begin, end, value) {
    const [y, m, d] = this.__getListIndex(begin);
    value['time'] = {
      begin: begin,
      end: end,
    };
    this.__createEmptyList(y, m, d);
    this.__list[y][m][d].push(value);
  }

  /* リストから値を取り出す */
  getData(begin, end, filter=null) {
    let rtn = [];
    const b_year = begin.getFullYear();
    const b_month = begin.getMonth();
    const b_date = begin.getDate();
    for (let i = new Date(b_year, b_month, b_date); i < end;
         i.setDate(i.getDate() + 1 )) {
      const [y, m, d] = this.__getListIndex(i);
      if (this.__list?.[y]?.[m]?.[d] === undefined) {
        continue;
      }
      for (const value of this.__list[y][m][d]) {
        if (value.time.begin < begin || value.time.end > end) {
          continue;
        }
        if (filter?.(value.time.begin, value.time.end, value)) {
          continue;
        }
        rtn.push(value);
      }
    }
    return rtn;
  }
}

export class TimeLine {
  __visits = new DataList(); /* 訪問場所 */
  __activities = new DataList(); /* 移動履歴 */
  __min_time = null;
  __max_time = null;

  /* コントラクタ */
  constructor(...time_lines) {
    for (const time_line of time_lines) {
      this.__visits.concat(time_line?.__visits);
      this.__activities.concat(time_line?.__activities);
      if (this.__min_time === null ||
          (time_line.__min_time !== null &&
          this.__min_time > time_line.__min_time)) {
        this.__min_time = time_line.__min_time;
      }
      if (this.__max_time === null ||
          (time_line.__max_time !== null &&
          this.__max_time < time_line.__max_time)) {
        this.__max_time = time_line.__max_time;
      }
    }
  }

  /* タイムライン日時の最大・最小を更新する */
  __updateMinMaxTime(begin, end) {
    if (this.__min_time === null || end < this.__min_time) {
      this.__min_time = end;
    }
    if (this.__max_time === null || begin > this.__max_time) {
      this.__max_time = begin;
    }
  }

  /* 訪問場所を追加する */
  addVisit(begin, end, latitude, longitude, user_handle=null) {
    this.__updateMinMaxTime(begin, end);
    this.__visits.push(begin, end, {
      point: {
        latitude: latitude,
        longitude: longitude,
      },
      user_handle: user_handle,
    });
  }

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
  }

  /* 移動履歴を追加する */
  addActivity(begin, end, points, user_handle=null) {
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
      user_handle: user_handle,
    });
  }

  /* 訪問場所を取得する */
  getVisits(begin, end, filter=null) {
    return this.__visits.getData(begin, end, filter);
  }

  /* 移動履歴を取得する */
  getActivities(begin, end, filter=null) {
    return this.__activities.getData(begin, end, filter);
  }

  /* 最小日時を取得する */
  getMinDate() {
    return this.__min_time;
  }

  /* 最大日時を取得する */
  getMaxDate() {
    return this.__max_time;
  }

  /* 移動距離を取得する */
  getDistance(begin, end, filter=null) {
    let distance = 0.0;
    const activities = this.getActivities(begin, end, filter);
    for (const activity of activities) {
      distance += activity.distance;
    }
    return Math.floor(distance) / 1000; /* m->km変換&小数点の切り捨て */
  }
}

export default defineNuxtPlugin(() => ({
  provide: { TimeLine }
}));
