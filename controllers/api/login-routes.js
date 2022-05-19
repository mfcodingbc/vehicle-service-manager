const router = require('express').Router();
const res = require('express/lib/response');
const { Owner } = require('../../models');
const withAuth = require('../../utils/auth');

router.post('/signup', async (req, res) => {
    try {
        const dbOwnerData = await Owner.create({
            first_name: req.body.first_name,
            last_name: req.body.last_name,
            email: req.body.email,
            password: req.body.password,
        });

        req.session.save(() => {
            req.session.loggedIn = true;

            res.status(200).json(dbOwnerData);
        });
    } catch (err) {
        console.log(err);
        res.status(500).json(err);
    }
});

// router.post('/logins', async (req, res) => {
//     try {
//         const dbOwnerData = await Owner.findOne({
//             where: {
//                 email: req.body.email,
//             },
//         });

//         if (!dbOwnerData) {
//             res.status(400).json({message: 'Incorrect email or password. Please try again.'});
//             return;
//         }

//         const validPassword = await dbOwnerData.checkPassword(req.body.password);

//         if (!validPassword) {
//             res.status(400).json({ message: 'Incorrect email or password. Please try again.'});
//             return;
//         }

//         passport.authenticate('local', { failureRedirect: '/logins' }),
//         function(req, res) {
//             res.redirect('/');
//         };
     
//         req.session.save(() => {
//             req.session.loggedIn = true;

//             res.status(200).json({ owner: dbOwnerData, message:'You are logged in!'});
//         });
//     } catch (err) {
//         console.log(err);
//         res.status(500).json(err);
//     }
// });

router.post('/logins', (req, res) => {
    Owner.findOne({
        where: {
            email: req.body.email
        }
    }).then(dbOwnerData => {
        if (!dbOwnerData) {
            res.status(400).json({ message: 'Incorrect email or password. Please try again.' });
            return;
        }

        const validPassword = dbOwnerData.checkPassword(req.body.password);
        if (!validPassword) {
            res.status(400).json({ message: 'Incorrect email or password. Please try again.' });
            return;
        }

        req.session.save(() => {
            req.session.user_id = dbOwnerData.id;
            req.session.username = dbOwnerData.email;
            req.session.loggedIn = true;

            res.status(200).json({ owner: dbOwnerData, message:'You are logged in!'});
        });

        passport.authenticate('local', 
        (err, user, info) => {
            if (err) {
                return next(err);
            }
        
            if (!user) {
                return res.redirect('/logins?info=' + info);
            }

            req.logIn(user, function(err) {
                if (err) {
                    return next(err);
                }

                return res.redirect('/dashboard');
            });

        })(req, res, next);
    });
});

router.post('/logout', (req, res) => {
    if (req.session.loggedIn) {
        res.session.destroy(() => {
            res.status(204).end();
        });
    } else {
        res.status(404).end();
    }
});

router.get('/logins', (req, res) => {
    if (req.session.loggedIn) {
        res.redirect('/dashboard');
        return;
      }
    res.render('login');
});

router.get('/signup', (req, res) => {
    if (req.session.loggedIn) {
        res.redirect('/dashboard');
        return;
      }
    res.render('signup');
});

module.exports = router;