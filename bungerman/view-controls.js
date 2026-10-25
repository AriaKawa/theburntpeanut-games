// Only the cabinet shares a zoom surface. Corner controls stay viewport-anchored.
const zoomSurface=document.createElement('div');
zoomSurface.className='zoom-surface';
const cabinet=document.querySelector('.cabinet');
cabinet.before(zoomSurface);
zoomSurface.append(cabinet);
let pageZoom=1;
function setPageZoom(value){
 pageZoom=Math.max(.6,Math.min(1.4,Math.round(value*100)/100));
 document.body.style.setProperty('--page-zoom',pageZoom);
}
window.addEventListener('wheel',event=>{
 if(event.ctrlKey||event.metaKey||!event.deltaY)return;
 event.preventDefault();
 setPageZoom(pageZoom+(event.deltaY<0?.05:-.05));
},{passive:false});
let expanded=document.body.classList.contains('fullscreen');
new MutationObserver(()=>{
 const next=document.body.classList.contains('fullscreen');
 if(next!==expanded){expanded=next;setPageZoom(1);}
}).observe(document.body,{attributes:true,attributeFilter:['class']});
setPageZoom(1);
