import React from 'react';
import type { BlockData, BlockType } from '../../types/blocks.ts';

import SectionBannerBlock from './SectionBannerBlock.tsx';
import ImageGalleryBlock from './ImageGalleryBlock.tsx';
import ImageCompareBlock from './ImageCompareBlock.tsx';
import DeliverableGridBlock from './DeliverableGridBlock.tsx';
import TimelineTableBlock from './TimelineTableBlock.tsx';
import NotableGridBlock from './NotableGridBlock.tsx';
import Tour360Block from './Tour360Block.tsx';
import YouTubeEmbedBlock from './YouTubeEmbedBlock.tsx';
import FilmEmbedBlock from './FilmEmbedBlock.tsx';
import HeadingBlock from './HeadingBlock.tsx';
import BodyLeadBlock from './BodyLeadBlock.tsx';
import BodyTextBlock from './BodyTextBlock.tsx';
import ResultsListBlock from './ResultsListBlock.tsx';
import RichTextBlock from './RichTextBlock.tsx';

export const blockComponentMap: Record<BlockType, React.ComponentType<{ block: BlockData }>> = {
  'SectionBanner':    SectionBannerBlock    as React.ComponentType<{ block: BlockData }>,
  'image-gallery':    ImageGalleryBlock     as React.ComponentType<{ block: BlockData }>,
  'image-compare':    ImageCompareBlock     as React.ComponentType<{ block: BlockData }>,
  'deliverable-grid': DeliverableGridBlock  as React.ComponentType<{ block: BlockData }>,
  'timeline-table':   TimelineTableBlock    as React.ComponentType<{ block: BlockData }>,
  'notable-grid':     NotableGridBlock      as React.ComponentType<{ block: BlockData }>,
  'tour-360':         Tour360Block          as React.ComponentType<{ block: BlockData }>,
  'youtube-embed':    YouTubeEmbedBlock     as React.ComponentType<{ block: BlockData }>,
  'film-embed':       FilmEmbedBlock        as React.ComponentType<{ block: BlockData }>,
  'heading':          HeadingBlock          as React.ComponentType<{ block: BlockData }>,
  'body-lead':        BodyLeadBlock         as React.ComponentType<{ block: BlockData }>,
  'body-text':        BodyTextBlock         as React.ComponentType<{ block: BlockData }>,
  'results-list':     ResultsListBlock      as React.ComponentType<{ block: BlockData }>,
  'rich-text':        RichTextBlock         as React.ComponentType<{ block: BlockData }>,
};
