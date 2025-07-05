exports.getAdminPage = async (req, res) => {
    res.render('admin', { title: 'Администрирование' });
};