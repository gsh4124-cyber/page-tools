import test from 'node:test';
import assert from 'node:assert/strict';
import {validateDraftPhotos,MAX_DRAFT_PHOTOS} from '../draft-photos.mjs';
const photo=(size=10,type='image/jpeg')=>({name:'photo.jpg',size,type});
test('draft photos enforce allowed image MIME, six files, per-file and aggregate limits',()=>{
 assert.equal(validateDraftPhotos(Array.from({length:6},()=>photo(8*1048576))).length,6);assert.equal(MAX_DRAFT_PHOTOS,48*1048576);
 for(const files of [[photo(10,'video/mp4')],[photo(10,'image/svg+xml')],[photo(0)],Array.from({length:7},()=>photo()),[photo(25*1048576+1)],Array.from({length:6},()=>photo(9*1048576))])assert.throws(()=>validateDraftPhotos(files));
});
