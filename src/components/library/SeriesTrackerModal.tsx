/* eslint-disable no-underscore-dangle */
/* eslint-disable @typescript-eslint/naming-convention */
import React, { useEffect, useState } from 'react';
import {
  Button,
  Col,
  Dropdown,
  InputNumber,
  List,
  Menu,
  Modal,
  Row,
  Spin,
  Tabs,
} from 'antd';
import {
  DownOutlined,
  CheckOutlined,
  ArrowRightOutlined,
} from '@ant-design/icons';
import Paragraph from 'antd/lib/typography/Paragraph';
import { ipcRenderer } from 'electron';
import log from 'electron-log';
import { Series } from 'houdoku-extension-lib';
import styles from './SeriesTrackerModal.css';
import ipcChannels from '../../constants/ipcChannels.json';
import { AniListTrackerMetadata } from '../../services/trackers/anilist';
import {
  TrackEntry,
  TrackerSeries,
  TrackStatus,
  TrackScoreFormat,
  TrackerMetadata,
} from '../../models/types';
import { updateSeriesTrackerKeys } from '../../features/library/utils';
import { MALTrackerMetadata } from '../../services/trackers/myanimelist';

const { TabPane } = Tabs;

const TRACKER_METADATAS = [AniListTrackerMetadata, MALTrackerMetadata];

const SCORE_FORMAT_OPTIONS: {
  [key in TrackScoreFormat]: number[];
} = {
  [TrackScoreFormat.POINT_10]: [...Array(11).keys()],
  [TrackScoreFormat.POINT_100]: [...Array(101).keys()],
  [TrackScoreFormat.POINT_10_DECIMAL]: [...Array(101).keys()],
  [TrackScoreFormat.POINT_5]: [...Array(6).keys()],
  [TrackScoreFormat.POINT_3]: [...Array(4).keys()],
};

type Props = {
  series: Series;
  loadSeriesContent: () => void;
  visible: boolean;
  toggleVisible: () => void;
};

const SeriesTrackerModal: React.FC<Props> = (props: Props) => {
  const [loading, setLoading] = useState(false);
  const [usernames, setUsernames] = useState<{
    [trackerId: string]: string | null;
  }>({});
  const [trackerSeriesLists, setTrackerSeriesLists] = useState<{
    [trackerId: string]: TrackerSeries[];
  }>({});
  const [trackEntries, setTrackEntries] = useState<{
    [trackerId: string]: TrackEntry;
  }>({});

  const loadTrackerData = async () => {
    setLoading(true);

    const _getUsername = (trackerId: string): Promise<string | null> =>
      ipcRenderer
        .invoke(ipcChannels.TRACKER.GET_USERNAME, trackerId)
        .catch((e) => log.error(e));
    const _getTrackEntry = (trackerId: string, trackerKey: string) =>
      ipcRenderer
        .invoke(ipcChannels.TRACKER.GET_LIBRARY_ENTRY, trackerId, trackerKey)
        .catch((e) => log.error(e));
    const _getSeriesList = (trackerId: string): Promise<TrackerSeries[]> =>
      ipcRenderer
        .invoke(ipcChannels.TRACKER.SEARCH, trackerId, props.series.title)
        .catch((e) => log.error(e));

    const _usernames: { [trackerId: string]: string | null } = {};
    const _trackEntries: { [trackerId: string]: TrackEntry } = {};
    const _trackerSeriesLists: { [trackerId: string]: TrackerSeries[] } = {};

    await Promise.all(
      TRACKER_METADATAS.map(async (trackerMetadata) => {
        const username = await _getUsername(trackerMetadata.id);
        _usernames[trackerMetadata.id] = username;

        if (
          props.series.trackerKeys &&
          props.series.trackerKeys[trackerMetadata.id]
        ) {
          const trackerKey = props.series.trackerKeys[trackerMetadata.id];
          const sourceTrackEntry = await _getTrackEntry(
            trackerMetadata.id,
            trackerKey
          );

          _trackEntries[trackerMetadata.id] =
            sourceTrackEntry === null
              ? {
                  seriesId: trackerKey,
                  progress: 0,
                  status: TrackStatus.Reading,
                }
              : sourceTrackEntry;
        } else {
          const seriesList = await _getSeriesList(trackerMetadata.id);
          _trackerSeriesLists[trackerMetadata.id] = seriesList.slice(0, 5);
        }
      })
    );

    setUsernames(_usernames);
    setTrackEntries(_trackEntries);
    setTrackerSeriesLists(_trackerSeriesLists);
    setLoading(false);
  };

  const sendTrackEntry = (trackerId: string, trackEntry: TrackEntry) => {
    setTrackEntries({ ...trackEntries, [trackerId]: trackEntry });

    ipcRenderer
      .invoke(ipcChannels.TRACKER.UPDATE_LIBRARY_ENTRY, trackerId, trackEntry)
      .catch((e) => log.error(e));
  };

  const applySeriesTrackerKey = (trackerId: string, key: string) => {
    updateSeriesTrackerKeys(props.series, {
      ...props.series.trackerKeys,
      [trackerId]: key,
    });
    props.loadSeriesContent();
  };

  const renderTrackerSeriesList = (trackerId: string) => {
    return (
      <List
        header={null}
        footer={null}
        bordered
        dataSource={trackerSeriesLists[trackerId]}
        renderItem={(item) => (
          <List.Item
            key={item.id}
            extra={
              <Button onClick={() => applySeriesTrackerKey(trackerId, item.id)}>
                Link
              </Button>
            }
          >
            <List.Item.Meta
              avatar={
                <img
                  className={styles.coverImg}
                  src={item.coverUrl}
                  alt="cover"
                />
              }
              title={
                <Paragraph className={styles.listItemTitle}>
                  {item.title}
                </Paragraph>
              }
              description={
                <Paragraph className={styles.listItemDescription}>
                  {item.description.substr(0, 80)}...
                </Paragraph>
              }
            />
          </List.Item>
        )}
      />
    );
  };

  const renderTrackEntry = (trackerMetadata: TrackerMetadata) => {
    const trackEntry = trackEntries[trackerMetadata.id];
    if (trackEntry === undefined)
      return <Paragraph>Failed to define tracker entry.</Paragraph>;

    return (
      <>
        <Row className={styles.row}>
          <Col span={8}>Status</Col>
          <Col span={8}>
            <Dropdown
              overlay={
                <Menu
                  onClick={(e: any) =>
                    sendTrackEntry(trackerMetadata.id, {
                      ...trackEntry,
                      status: e.item.props['data-value'] as TrackStatus,
                    })
                  }
                >
                  <Menu.Item key={1} data-value={TrackStatus.Completed}>
                    {TrackStatus.Completed}
                  </Menu.Item>
                  <Menu.Item key={2} data-value={TrackStatus.Dropped}>
                    {TrackStatus.Dropped}
                  </Menu.Item>
                  <Menu.Item key={3} data-value={TrackStatus.Paused}>
                    {TrackStatus.Paused}
                  </Menu.Item>
                  <Menu.Item key={4} data-value={TrackStatus.Planning}>
                    {TrackStatus.Planning}
                  </Menu.Item>
                  <Menu.Item key={5} data-value={TrackStatus.Reading}>
                    {TrackStatus.Reading}
                  </Menu.Item>
                </Menu>
              }
            >
              <Button>
                {trackEntry?.status} <DownOutlined />
              </Button>
            </Dropdown>
          </Col>
          <Col>
            <Button
              type="primary"
              onClick={() =>
                window.open(
                  `${trackerMetadata.url}/manga/${trackEntry.seriesId}`,
                  '_blank'
                )
              }
            >
              {trackerMetadata.name} <ArrowRightOutlined rotate={-45} />
            </Button>
          </Col>
        </Row>
        <Row className={styles.row}>
          <Col span={8}>Progress</Col>
          <Col span={16}>
            <span>
              <InputNumber
                className={styles.progressInput}
                min={0}
                value={trackEntry.progress}
                onChange={(value) =>
                  setTrackEntries({
                    ...trackEntries,
                    [trackerMetadata.id]: { ...trackEntry, progress: value },
                  })
                }
              />
              <Button
                className={styles.progressSubmitButton}
                icon={<CheckOutlined />}
                onClick={() => sendTrackEntry(trackerMetadata.id, trackEntry)}
              />
            </span>
          </Col>
        </Row>
        <Row className={styles.row}>
          <Col span={8}>Score</Col>
          <Col span={16}>
            <Dropdown
              overlay={
                <Menu
                  onClick={(e: any) => {
                    sendTrackEntry(trackerMetadata.id, {
                      ...trackEntry,
                      score: parseInt(e.item.props['data-value'], 10),
                    });
                  }}
                >
                  {SCORE_FORMAT_OPTIONS[
                    trackEntry.scoreFormat || TrackScoreFormat.POINT_10
                  ].map((value: number) => (
                    <Menu.Item key={value} data-value={value}>
                      {value}
                    </Menu.Item>
                  ))}
                </Menu>
              }
            >
              <Button>
                {trackEntry.score === undefined ? '-' : trackEntry.score}{' '}
                <DownOutlined />
              </Button>
            </Dropdown>
          </Col>
        </Row>
        <Paragraph className={styles.unlinkText}>
          <a
            onClick={() => {
              applySeriesTrackerKey(trackerMetadata.id, '');
            }}
          >
            Unlink this series.
          </a>
        </Paragraph>
      </>
    );
  };

  const renderTrackerContent = (trackerMetadata: TrackerMetadata) => {
    if (!usernames[trackerMetadata.id]) {
      if (loading) {
        return (
          <div className={styles.loaderContainer}>
            <Spin />
            <Paragraph>Loading from {trackerMetadata.name}...</Paragraph>
          </div>
        );
      }

      return (
        <Paragraph>
          In order to track this series, please link your {trackerMetadata.name}{' '}
          account through the Settings tab on the left.
        </Paragraph>
      );
    }

    return props.series.trackerKeys &&
      props.series.trackerKeys[trackerMetadata.id]
      ? renderTrackEntry(trackerMetadata)
      : renderTrackerSeriesList(trackerMetadata.id);
  };

  useEffect(() => {
    setUsernames({});
    setTrackEntries({});
    setTrackerSeriesLists({});

    if (props.visible) {
      loadTrackerData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.series, props.visible]);

  return (
    <Modal
      title="Trackers"
      visible={props.visible}
      footer={null}
      onCancel={props.toggleVisible}
    >
      <Tabs tabPosition="top" className={styles.tabs}>
        {TRACKER_METADATAS.map((trackerMetadata) => (
          <TabPane tab={trackerMetadata.name} key={trackerMetadata.id}>
            {renderTrackerContent(trackerMetadata)}
          </TabPane>
        ))}
      </Tabs>
    </Modal>
  );
};

export default SeriesTrackerModal;
