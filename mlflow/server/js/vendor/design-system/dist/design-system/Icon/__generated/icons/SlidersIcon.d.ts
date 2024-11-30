import * as React from 'react';
import type { IconProps } from '../../Icon';
declare const SlidersIcon: React.ForwardRefExoticComponent<Pick<IconProps, `data-${string}` | "className" | "style" | "tabIndex" | "children" | "disabled" | "multiple" | "draggable" | "onFocus" | "onBlur" | "onKeyDown" | "onContextMenu" | "onClick" | "onDoubleClick" | "onScroll" | "onSelect" | "onLoad" | "onMouseEnter" | "onMouseLeave" | "onDragStart" | "onDragEnter" | "onDragOver" | "onDragLeave" | "onDragEnd" | "onDrop" | "height" | "default" | "size" | "dangerouslySetAntdProps" | "type" | "href" | "title" | "aria-label" | "autoFocus" | "open" | "download" | "hrefLang" | "media" | "rel" | "target" | "defaultChecked" | "defaultValue" | "suppressContentEditableWarning" | "suppressHydrationWarning" | "accessKey" | "contentEditable" | "contextMenu" | "dir" | "hidden" | "id" | "lang" | "placeholder" | "slot" | "spellCheck" | "translate" | "radioGroup" | "role" | "about" | "datatype" | "inlist" | "prefix" | "property" | "resource" | "typeof" | "vocab" | "autoCapitalize" | "autoCorrect" | "autoSave" | "color" | "itemProp" | "itemScope" | "itemType" | "itemID" | "itemRef" | "results" | "security" | "unselectable" | "inputMode" | "is" | "aria-activedescendant" | "aria-atomic" | "aria-autocomplete" | "aria-busy" | "aria-checked" | "aria-colcount" | "aria-colindex" | "aria-colspan" | "aria-controls" | "aria-current" | "aria-describedby" | "aria-details" | "aria-disabled" | "aria-dropeffect" | "aria-errormessage" | "aria-expanded" | "aria-flowto" | "aria-grabbed" | "aria-haspopup" | "aria-hidden" | "aria-invalid" | "aria-keyshortcuts" | "aria-labelledby" | "aria-level" | "aria-live" | "aria-modal" | "aria-multiline" | "aria-multiselectable" | "aria-orientation" | "aria-owns" | "aria-placeholder" | "aria-posinset" | "aria-pressed" | "aria-readonly" | "aria-relevant" | "aria-required" | "aria-roledescription" | "aria-rowcount" | "aria-rowindex" | "aria-rowspan" | "aria-selected" | "aria-setsize" | "aria-sort" | "aria-valuemax" | "aria-valuemin" | "aria-valuenow" | "aria-valuetext" | "dangerouslySetInnerHTML" | "onCopy" | "onCopyCapture" | "onCut" | "onCutCapture" | "onPaste" | "onPasteCapture" | "onCompositionEnd" | "onCompositionEndCapture" | "onCompositionStart" | "onCompositionStartCapture" | "onCompositionUpdate" | "onCompositionUpdateCapture" | "onFocusCapture" | "onBlurCapture" | "onChange" | "onChangeCapture" | "onBeforeInput" | "onBeforeInputCapture" | "onInput" | "onInputCapture" | "onReset" | "onResetCapture" | "onSubmit" | "onSubmitCapture" | "onInvalid" | "onInvalidCapture" | "onLoadCapture" | "onError" | "onErrorCapture" | "onKeyDownCapture" | "onKeyPress" | "onKeyPressCapture" | "onKeyUp" | "onKeyUpCapture" | "onAbort" | "onAbortCapture" | "onCanPlay" | "onCanPlayCapture" | "onCanPlayThrough" | "onCanPlayThroughCapture" | "onDurationChange" | "onDurationChangeCapture" | "onEmptied" | "onEmptiedCapture" | "onEncrypted" | "onEncryptedCapture" | "onEnded" | "onEndedCapture" | "onLoadedData" | "onLoadedDataCapture" | "onLoadedMetadata" | "onLoadedMetadataCapture" | "onLoadStart" | "onLoadStartCapture" | "onPause" | "onPauseCapture" | "onPlay" | "onPlayCapture" | "onPlaying" | "onPlayingCapture" | "onProgress" | "onProgressCapture" | "onRateChange" | "onRateChangeCapture" | "onSeeked" | "onSeekedCapture" | "onSeeking" | "onSeekingCapture" | "onStalled" | "onStalledCapture" | "onSuspend" | "onSuspendCapture" | "onTimeUpdate" | "onTimeUpdateCapture" | "onVolumeChange" | "onVolumeChangeCapture" | "onWaiting" | "onWaitingCapture" | "onAuxClick" | "onAuxClickCapture" | "onClickCapture" | "onContextMenuCapture" | "onDoubleClickCapture" | "onDrag" | "onDragCapture" | "onDragEndCapture" | "onDragEnterCapture" | "onDragExit" | "onDragExitCapture" | "onDragLeaveCapture" | "onDragOverCapture" | "onDragStartCapture" | "onDropCapture" | "onMouseDown" | "onMouseDownCapture" | "onMouseMove" | "onMouseMoveCapture" | "onMouseOut" | "onMouseOutCapture" | "onMouseOver" | "onMouseOverCapture" | "onMouseUp" | "onMouseUpCapture" | "onSelectCapture" | "onTouchCancel" | "onTouchCancelCapture" | "onTouchEnd" | "onTouchEndCapture" | "onTouchMove" | "onTouchMoveCapture" | "onTouchStart" | "onTouchStartCapture" | "onPointerDown" | "onPointerDownCapture" | "onPointerMove" | "onPointerMoveCapture" | "onPointerUp" | "onPointerUpCapture" | "onPointerCancel" | "onPointerCancelCapture" | "onPointerEnter" | "onPointerEnterCapture" | "onPointerLeave" | "onPointerLeaveCapture" | "onPointerOver" | "onPointerOverCapture" | "onPointerOut" | "onPointerOutCapture" | "onGotPointerCapture" | "onGotPointerCaptureCapture" | "onLostPointerCapture" | "onLostPointerCaptureCapture" | "onScrollCapture" | "onWheel" | "onWheelCapture" | "onAnimationStart" | "onAnimationStartCapture" | "onAnimationEnd" | "onAnimationEndCapture" | "onAnimationIteration" | "onAnimationIterationCapture" | "onTransitionEnd" | "onTransitionEndCapture" | "form" | "formAction" | "formEncType" | "formMethod" | "formNoValidate" | "formTarget" | "name" | "value" | "list" | "step" | "shape" | "checked" | "component" | "acceptCharset" | "action" | "autoComplete" | "encType" | "method" | "noValidate" | "maxLength" | "label" | "span" | "cite" | "data" | "summary" | "pattern" | "key" | "width" | "accept" | "alt" | "capture" | "crossOrigin" | "max" | "min" | "minLength" | "readOnly" | "required" | "src" | "cols" | "rows" | "wrap" | "loop" | "rotate" | "viewBox" | "content" | "start" | "high" | "low" | "ariaLabel" | "nonce" | "async" | "manifest" | "allowFullScreen" | "allowTransparency" | "as" | "autoPlay" | "cellPadding" | "cellSpacing" | "charSet" | "challenge" | "classID" | "colSpan" | "controls" | "coords" | "dateTime" | "defer" | "frameBorder" | "headers" | "htmlFor" | "httpEquiv" | "integrity" | "keyParams" | "keyType" | "kind" | "marginHeight" | "marginWidth" | "mediaGroup" | "muted" | "optimum" | "playsInline" | "poster" | "preload" | "reversed" | "rowSpan" | "sandbox" | "scope" | "scoped" | "scrolling" | "seamless" | "selected" | "sizes" | "srcDoc" | "srcLang" | "srcSet" | "useMap" | "wmode" | "spin"> & React.RefAttributes<HTMLSpanElement>>;
export default SlidersIcon;
//# sourceMappingURL=SlidersIcon.d.ts.map