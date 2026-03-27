import React from 'react';
import './TableOfContents.css';

interface ContentItem {
    id: number;
    title: string;
    type: 'chapter' | 'topic';
    content?: string;
    page_number?: string;
    is_active?: boolean;
    show_in_index?: boolean;
}

interface TableOfContentsProps {
    contents: ContentItem[];
    onNavigate?: (item: ContentItem) => void;
}

const CHAPTER_COLORS = [
    'toc-bg-blue',
    'toc-bg-pink',
    'toc-bg-purple',
    'toc-bg-indigo',
    'toc-bg-pink', // Reusing pink for Ch 5 as in image
    'toc-bg-beige'
];

const TableOfContents: React.FC<TableOfContentsProps> = ({ contents, onNavigate }) => {
    // Filter out items that are inactive OR explicitly hidden from index
    const activeContents = contents.filter(item => item.is_active !== false && item.show_in_index !== false);

    // Group contents by chapter
    const groups: { chapter: ContentItem; topics: ContentItem[]; color: string }[] = [];
    let currentGroup: { chapter: ContentItem; topics: ContentItem[]; color: string } | null = null;
    let chapterCount = 0;

    activeContents.forEach((item) => {
        if (item.type === 'chapter') {
            currentGroup = {
                chapter: item,
                topics: [],
                color: CHAPTER_COLORS[chapterCount % CHAPTER_COLORS.length]
            };
            groups.push(currentGroup);
            chapterCount++;
        } else if (currentGroup) {
            currentGroup.topics.push(item);
        }
    });

    return (
        <div className="toc-container">
            <div className="toc-header">
                <h1 className="toc-title">Contents</h1>
            </div>

            <div className="toc-grid-header">
                <span>TOPICS</span>
                <span className="text-center">PAGES</span>
            </div>

            <div className="toc-body">
                {groups.map((group, gIdx) => (
                    <div key={`group-${gIdx}`} className="toc-chapter-block">
                        {/* Chapter Row */}
                        <div 
                            className={`toc-row toc-chapter-row ${group.color}`}
                            onClick={() => onNavigate?.(group.chapter)}
                        >
                            <span>{group.chapter.title}</span>
                            <span className="toc-page">{group.chapter.page_number}</span>
                        </div>

                        {/* Topic Rows */}
                        {group.topics.map((topic, tIdx) => (
                            <div 
                                key={`topic-${tIdx}`} 
                                className={`toc-row toc-topic-row ${group.color}`}
                                onClick={() => onNavigate?.(topic)}
                            >
                                <span>{topic.title}</span>
                                <span className="toc-page">{topic.page_number}</span>
                            </div>
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default TableOfContents;
