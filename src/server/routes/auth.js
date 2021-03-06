const router = require("express").Router();
const { check, validationResult } = require("express-validator");
const bcrypt = require("bcrypt");
const JWT = require("jsonwebtoken");
const passport = require("../config/passport");
const checkAuth = require("../middleware/checkAuth");
const asyncHandler = require("express-async-handler");
const qs = require("qs");

//DB
const User = require("../models/User");

// 유저 토큰 생성 함수
function generateUserToken(id, name) {
  const token = JWT.sign(
    {
      id,
      name,
    },
    process.env.JWT_KEY, //여기 있는거 시크릿키임
    {
      expiresIn: 3600000, //2시간동안 토큰 있음
    }
  );
  return token;
}

// google-oauth
router.get(
  "/google",
  passport.authenticate("google", {
    session: false,
    scope: ["email", "profile"],
  }) // 구글 로그인 페이지로 이동하여 로그인 이루어짐
);

router.get(
  "/google/callback", // 로그인 성공 시 callbackURL 설정에 따라 이 라우터로 이동
  passport.authenticate("google", { session: false }),
  (req, res) => {
    const { id, name } = req.user;
    const token = generateUserToken(id, name);
    const query = qs.stringify({ token }); // token=string , 객체를 쿼리스트링으로 만들어준다.
    res.redirect(`/auth-redirect?${query}`);
  }
);

router.post(
  "/signup",
  [
    check("id", "6자 이상의 아이디를 입력해 주세요").isLength({
      min: 6,
    }),
    check("password", "6자 이상의 비밀번호를 입력해 주세요").isLength({
      min: 6,
    }),
    check("name", "닉네임을 입력해 주세요").isLength({
      min: 1,
    }),
  ],
  asyncHandler(async (req, res) => {
    const { password, id, name } = req.body;

    //input 조건에 맞는지 확인(check에서 실패할경우 여기로 들어감)
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({
        errors: errors.array(),
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    let user = new User({
      name,
      id,
      password: hashedPassword,
      type: "superslap",
    });

    await user.save(); // db에 user 저장

    return res.json({
      token: generateUserToken(user.id, user.name),
    });
  })
);

router.post(
  "/checkId",
  asyncHandler(async (req, res) => {
    const { id } = req.body;

    let user1 = await User.findOne({ id });
    if (user1) {
      return res.json({
        success: false,
      });
    } else {
      return res.json({
        success: true,
      });
    }
  })
);

router.post(
  "/login",
  asyncHandler(async (req, res) => {
    const { password, id } = req.body;
    let user = await User.findOne({ id: id, type: "superslap" });
    if (!user) {
      return res.json({ success: false, msg: "유효하지 않은 아이디입니다." });
    }

    let isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.json({ success: false, msg: "유효하지 않은 비밀번호입니다." });
    }

    return res.json({
      token: generateUserToken(user.id, user.name),
      success: true,
    });
  })
);

router.get(
  "/user",
  checkAuth.headerToUserId,
  asyncHandler(async (req, res) => {
    const id = req.user;
    try {
      const user = await User.findOne({ id }, { id: 1, name: 1 });
      if (!user) {
        res.status(404).json({
          message: "유저가 존재하지 않습니다.",
        });
      } else {
        res.json({ user });
      }
    } catch {
      res.status(500).json({
        message: "Internal Server Error",
      });
    }
  })
);

module.exports = router;
