import { Chapter, Series } from '../models/types';
import {
  DatabaseAction,
  BEFORE_LOAD_SERIES_LIST,
  BEFORE_LOAD_SERIES,
  AFTER_LOAD_SERIES,
  AFTER_LOAD_SERIES_LIST,
  AFTER_LOAD_CHAPTER_LIST,
  BEFORE_LOAD_CHAPTER_LIST,
  AFTER_LOAD_CHAPTER,
  BEFORE_LOAD_CHAPTER,
} from './types';

export function beforeLoadSeriesList(): DatabaseAction {
  return {
    type: BEFORE_LOAD_SERIES_LIST,
  };
}

export function afterLoadSeriesList(response: any): DatabaseAction {
  return {
    type: AFTER_LOAD_SERIES_LIST,
    payload: {
      response,
    },
  };
}

export function beforeLoadSeries(): DatabaseAction {
  return {
    type: BEFORE_LOAD_SERIES,
  };
}

export function afterLoadSeries(series: Series): DatabaseAction {
  return {
    type: AFTER_LOAD_SERIES,
    payload: {
      series,
    },
  };
}

export function beforeLoadChapter(): DatabaseAction {
  return {
    type: BEFORE_LOAD_CHAPTER,
  };
}

export function afterLoadChapter(chapter: Chapter): DatabaseAction {
  return {
    type: AFTER_LOAD_CHAPTER,
    payload: {
      chapter,
    },
  };
}

export function beforeLoadChapterList(): DatabaseAction {
  return {
    type: BEFORE_LOAD_CHAPTER_LIST,
  };
}

export function afterLoadChapterList(response: any): DatabaseAction {
  return {
    type: AFTER_LOAD_CHAPTER_LIST,
    payload: {
      response,
    },
  };
}
