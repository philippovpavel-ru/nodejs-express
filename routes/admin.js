const express = require('express')
const router = express.Router()
const formidable = require('formidable')
const db = require('../db')
const path = require('path')
const fs = require('fs')

router.get('/', (req, res, next) => {
  const skills = db.get('skills').value()
  const skill = skills.map(skill => skill.number)

  res.render('pages/admin', {
    title: 'Admin page',
    msgskill: req.flash('msgskill')[0],
    msgfile: req.flash('msgfile')[0],
    value: skill
  })
})

router.post('/skills', (req, res, next) => {
    const formData = req.body
    Object.keys(formData).forEach((key) => {
      db.get('skills')
      .find({ type: key })
      .assign({ number: formData[key] })
      .write();
    })

    req.flash('msgskill', 'Навыки обновленны')
    res.redirect('/admin')
})

router.post('/upload', (req, res, next) => {
  const form = new formidable.IncomingForm()
  form.uploadDir = path.join(__dirname, '../', 'upload')

  if (!fs.existsSync(form.uploadDir)) {
    fs.mkdirSync(form.uploadDir)
  }

  form.parse(req, (err, fields, files) => {
    if (err) {
      console.log(err)
      req.flash('msgfile', 'Ошибка при загрузке файла');
      return res.redirect('/admin')
    }

    const { name, price } = fields
    const {filepath, originalFilename }= files.photo[0]

    // console.log(files.photo)

    const valid = validation(fields, files)
    if (valid.err) {
      fs.unlinkSync(filepath)
      req.flash('msgfile', valid.status)
      return res.redirect('/admin')
    } else {
      fs.renameSync(filepath, path.join(form.uploadDir, originalFilename))
    }

    const newProduct = {
      name: name[0],
      price: Number(price),
      src: `/${originalFilename}`, // Путь к загруженному файлу 
    }

    db.get('products')
      .push(newProduct)
      .write()

    req.flash('msgfile', 'Файлы успешно добавлены')
    res.redirect('/admin')
  })
})

const validation = (fields, files) => {
  console.log(files.photo.originalFilename)
  if (files.photo.size === 0) {
    return { status: 'Не загружена картинка!', err: true }
  }
  if (!fields.name[0]) {
    return { status: 'Не указано название товара!', err: true }
  }
  if (!fields.price[0]) {
    return { status: 'Не указана цена товара!', err: true }
  }
  return { status: 'Ok', err: false }
}

module.exports = router
