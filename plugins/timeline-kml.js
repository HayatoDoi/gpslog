/*
 * Google My Mapなどでインポートできるkmlファイルを管理する
 */

import { TimeLine } from './timeline';

const KML_NAMESPACE = 'http://www.opengis.net/kml/2.2';
const GX_NAMESPACE = 'http://www.google.com/kml/ext/2.2';
const XML_HEADER = '<?xml version="1.0" encoding="UTF-8"?>';
const UPPER_TAGS = [
  ['document', 'Document'],
  ['placemark', 'Placemark'],
  ['point', 'Point'],
  ['timespan', 'TimeSpan'],
  ['linestring', 'LineString'],
];

class TimeLineKml extends TimeLine {
  __kml = null;

  /* kmlファイルを読み込む */
  load(test) {
    const parser = new DOMParser();
    this.__kml = parser.parseFromString(test, 'application/xml');
    const doc = this.__kml.getElementsByTagName('Document')[0];
    if (!doc) {
      throw new Error('Invalid KML format: missing <Document> tag');
    }

    const placemarks = doc.getElementsByTagName('Placemark');
    for (const placemark of placemarks) {
      const name = placemark.getElementsByTagName('name')[0]?.textContent || '';
      const point = placemark.getElementsByTagName('Point')[0];
      const linestring = placemark.getElementsByTagName('LineString')[0];
      if (point) {
        const coordinates = point.getElementsByTagName('coordinates')[0].textContent.split(',');
        const latitude = parseFloat(coordinates[1]);
        const longitude = parseFloat(coordinates[0]);
        const timespan = placemark.getElementsByTagName('TimeSpan')[0];
        const begin = new Date(timespan.getElementsByTagName('begin')[0].textContent);
        const end = new Date(timespan.getElementsByTagName('end')[0].textContent);
        this.addVisit(begin, end, latitude, longitude);
      }
      if (linestring) {
        const coordinatesText = linestring.getElementsByTagName('coordinates')[0].textContent;
        const points = coordinatesText.trim().split(/\s+/).map(coord => {
          const [longitude, latitude] = coord.split(',').map(Number);
          return { latitude, longitude };
        });
        const timespan = placemark.getElementsByTagName('TimeSpan')[0];
        const begin = new Date(timespan.getElementsByTagName('begin')[0].textContent);
        const end = new Date(timespan.getElementsByTagName('end')[0].textContent);
        this.addActivity(begin, end, points);
      }
    }
  }

  __createElement(tag, text) {
    const el = document.createElement(tag);
    if (text !== undefined) el.innerText = text;
    return el;
  }

  __addPlace(name, latitude, longitude, begin, end) {
    const doc = this.__kml.getElementsByTagName('document')[0];
    const placemark = this.__createElement('placemark');
    placemark.appendChild(this.__createElement('name', name));

    const point = this.__createElement('point');
    point.appendChild(this.__createElement('coordinates', `${longitude},${latitude},0`));
    placemark.appendChild(point);

    const timespan = this.__createElement('timespan');
    timespan.appendChild(this.__createElement('begin', begin.toISOString()));
    timespan.appendChild(this.__createElement('end', end.toISOString()));
    placemark.appendChild(timespan);

    doc.appendChild(placemark);
  }

  __addLines(name, points, begin, end) {
    const doc = this.__kml.getElementsByTagName('document')[0];
    const placemark = this.__createElement('placemark');
    placemark.appendChild(this.__createElement('name', name));

    const linestring = this.__createElement('linestring');
    const coordinates = this.__createElement('coordinates', points.map(
      p => `${p.longitude},${p.latitude},0`
    ).join(' '));
    linestring.appendChild(coordinates);
    placemark.appendChild(linestring);

    const timespan = this.__createElement('timespan');
    timespan.appendChild(this.__createElement('begin', begin.toISOString()));
    timespan.appendChild(this.__createElement('end', end.toISOString()));
    placemark.appendChild(timespan);

    doc.appendChild(placemark);
  }

  toString(begin, end) {
    this.__kml = document.createElement('kml');
    this.__kml.setAttribute('xmlns', KML_NAMESPACE);
    this.__kml.setAttribute('xmlns:gx', GX_NAMESPACE);

    const doc = document.createElement('document');
    this.__kml.appendChild(doc);

    this.getVisits(begin, end).forEach(visit => {
      this.__addPlace(
        '',
        visit.point.latitude,
        visit.point.longitude,
        visit.time.begin,
        visit.time.end
      );
    });

    this.getActivities(begin, end).forEach(activity => {
      this.__addLines(
        '',
        activity.points,
        activity.time.begin,
        activity.time.end
      );
    });

    let text = new XMLSerializer().serializeToString(this.__kml).replace(/\sxmlns="[^"]+"/, '');
    UPPER_TAGS.forEach(([lower, upper]) => {
      text = text.replaceAll(`<${lower}>`, `<${upper}>`);
      text = text.replaceAll(`</${lower}>`, `</${upper}>`);
    });
    return XML_HEADER + '\n' + text;
  }
}

export default defineNuxtPlugin(() => ({
  provide: { TimeLineKml }
}));
