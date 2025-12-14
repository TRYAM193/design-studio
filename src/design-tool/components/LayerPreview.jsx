// src/components/LayerPreview.jsx
import React from 'react';

export default function LayerPreview({ object }) {
    if (!object) return null;

    const { type, props = {} } = object;

    const previewStyle = {
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
    };

    // -------------------------------
    // TEXT PREVIEW (fixed: null checks)
    // -------------------------------
    if (type === 'text') {
        const textPreviewStyle = {
            color: props.fill || '#000000',
            fontFamily: props.fontFamily || 'Arial',
            fontWeight: props.fontWeight === 'bold' ? 'bold' : 'normal',
            fontStyle: props.fontStyle === 'italic' ? 'italic' : 'normal',
            textDecoration: props.underline ? 'underline' : 'none',
            fontSize: '10px',
            lineHeight: '1.2',
            maxWidth: '100%',
            overflow: 'hidden',
            whiteSpace: 'nowrap',
            textOverflow: 'ellipsis',
        };

        const displayContent =
            props.text ? props.text.substring(0, 10) + '...' : 'Text';

        return (
            <div
                style={{ ...previewStyle, backgroundColor: '#fff', padding: '2px' }}
                title={props.text}
            >
                <span style={textPreviewStyle}>{displayContent}</span>
            </div>
        );
    }

    // -------------------------------
    // IMAGE PREVIEW (fixed: src check)
    // -------------------------------
    if (type === 'image') {
        if (!object.src) {
            return (
                <div style={{ ...previewStyle, backgroundColor: '#eee' }}>
                    Image
                </div>
            );
        }

        return (
            <div style={{ ...previewStyle, backgroundColor: '#fff' }}>
                <img
                    src={object.src}
                    alt="Thumbnail"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
            </div>
        );
    }

    // -------------------------------
    // SHAPE PREVIEW (fixed: fill check)
    // -------------------------------
    if (type === 'shape') {
        return (
            <div
                style={{
                    ...previewStyle,
                    backgroundColor: props.fill || '#ddd',
                    border: '1px solid #000',
                }}
                title="Shape"
            />
        );
    }

    // -------------------------------
    // FALLBACK
    // -------------------------------
    return (
        <div style={{ ...previewStyle, backgroundColor: '#f0f0f0' }}>
            {type || 'Object'}
        </div>
    );
}
